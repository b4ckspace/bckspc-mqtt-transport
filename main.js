var settings = require('./settings');
var Udpio = require('./Udpio');

var snmp = require('snmp-native');
var mqtt = require('mqtt');
var winston = require('winston');
var StatusAPI = require('bckspc-status');

///////////////////////////////////////////////////////////////////////////////
// Initialize

var logger = new winston.Logger;
logger.add(winston.transports.Console, { timestamp: true });

var mqttClient = mqtt.createClient(settings.mqtt.port, settings.mqtt.host);

///////////////////////////////////////////////////////////////////////////////
// Receive UDPIO Events

function udpioTransformer(key, value) {

   switch(key) {
      case 'backlock':
      case 'doorframe':
      case 'doorlock':
         return (value)? 'open' : 'closed';

      case 'doorbutton':
      case 'doorbell':
         return (value)? 'pressed' : 'released';
   }

   return value;
}

Object.keys(settings.udpio.mappings).forEach(function(namespace) {
   var events = settings.udpio.mappings[namespace];

   logger.info('Listing to UDPIO namespace ' + namespace);
   var udpio = new Udpio(namespace, settings.udpio.port, settings.udpio.ip);

   events.forEach(function(map) {
      logger.info('Attaching to event ' + namespace + '/' + map.key);
      udpio.on(map.key, function(value) {
         logger.info('Event ' + namespace + '/' + map.key + ' triggered. Value: ' + value);

         var newValue = udpioTransformer(map.key, value);
         if(value != newValue) {
            logger.info('Event ' + namespace + '/' + map.key + ' value transformed from ' + value + ' to ' + newValue);
         }

         mqttClient.publish(map.dest, '' + newValue);
      });
   });

});

///////////////////////////////////////////////////////////////////////////////
// Receive Status API Changes

var statusApi = new StatusAPI(settings.statusApi.url, settings.statusApi.interval);

statusApi.on('space_opened', function() {
   logger.info('Status Event "space_opened" triggered');
   mqttClient.publish('sensor/space/status', 'open');
});

statusApi.on('space_closed', function() {
   logger.info('Status Event "space_closed" triggered');
   mqttClient.publish('sensor/space/status', 'closed');
});

statusApi.on('member_count', function(count) {
   logger.info('Status member count changed to ' + count);
   mqttClient.publish('sensor/space/member/count', ''+count);
});

///////////////////////////////////////////////////////////////////////////////
// Subscribe to SNMP topics

settings.snmp.mappings.forEach(function(entry) {

   logger.info('Subscribe to SNMP oid ' + entry.oid + ' on host ' + entry.host);

   var snmpSession = new snmp.Session({
      host: entry.host,
      port: entry.port || settings.snmp.defaults.port,
      community: entry.community || settings.snmp.defaults.community
   });

   var random = parseInt(Math.random()*4200.0, 10);
   var lastValue = false;

   setInterval(function() {

      logger.info('Trying to retrieve ' + entry.oid + ' from host ' + entry.host);

      snmpSession.get({ oid: entry.oid }, function(error, varbinds) {
         if(error) {
            logger.error('Failed to retrieve ' + entry.oid + ' from host ' + entry.host);
            return;
         }

         var value = varbinds[0].value;

         if(lastValue === false || lastValue != value) {
            lastValue = value;

            logger.info('Retrieved ' + entry.oid + ' from host ' + entry.host + ' with value "' + value + '"');
            mqttClient.publish(entry.dest, '' + value);
         } else {
            logger.info('Unchanged value retrieved ' + entry.oid + ' from host ' + entry.host + '. Skipping');
         }
      });

   }, (entry.interval || settings.snmp.defaults.interval) * 1000 + random);
});
