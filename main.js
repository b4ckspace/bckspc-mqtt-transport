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

Object.keys(settings.udpio.mappings).forEach(function(namespace) {
   var events = settings.udpio.mappings[namespace];

   logger.info('Listing to UDPIO namespace ' + namespace);
   var udpio = new Udpio(namespace, settings.udpio.port, settings.udpio.ip);

   events.forEach(function(map) {
      logger.info('Attaching to event ' + namespace + '/' + map.key);
      udpio.on(map.key, function(value) {
         logger.info('Event ' + namespace + '/' + map.key + ' triggered. Value: ' + value);
         mqttClient.publish(map.dest, '' + value);
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
   mqttClient.publish('sensor/space/member/count', count);
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
   setInterval(function() {

      logger.info('Trying to retrieve ' + entry.oid + ' from host ' + entry.host);

      snmpSession.get({ oid: entry.oid }, function(error, varbinds) {
         if(error) {
            logger.error('Failed to retrieve ' + entry.oid + ' from host ' + entry.host);
            return;
         }

         var value = varbinds[0].value;
         logger.info('Retrieved ' + entry.oid + ' from host ' + entry.host + ' with value "' + value + '"');

         mqttClient.publish(entry.dest, '' + value);
      });

   }, (entry.interval || settings.snmp.defaults.interval) * 1000 + random);
});
