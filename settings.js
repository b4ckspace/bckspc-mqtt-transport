module.exports = {
   udpio: {
      ip: '255.255.255.255',
      port: 5042,
      mappings: {
         'COMMON': [
            { key: 'irc_alarm', dest: 'psa/alarm' },
            { key: 'pizza_timer', dest: 'psa/pizza' },
         ],
         'AIO0': [
            { key: 'doorlock', dest: 'sensor/door/lock' },
            { key: 'doorframe', dest: 'sensor/door/frame' },
            { key: 'doorbutton', dest: 'sensor/door/button' },
            { key: 'doorbell', dest: 'sensor/door/bell' },
            { key: 'backlock', dest: 'sensor/backdoor/lock' }
         ]
      }
   },
   mqtt: {
      host: 'mqtt',
      port: 1883,
      options: {
         retain: true,
         qos: 1
      }
   },
   statusApi: {
      url: 'http://status.bckspc.de/status.php?response=json',
      interval: 60
   },
   snmp: {
      defaults: {
         interval: 60,
         community: '',
         port: 161
      },
      mappings: [
         { host: 'ginger', oid: '.1.3.6.1.4.1.2021.8.1.101.1', dest: 'sensor/space/accountBalance' },
         { host: 'garlic', oid: '.1.3.6.1.4.1.2021.8.1.101.1', dest: 'sensor/temperature/hackcenter/shelf' },
         { host: 'garlic', oid: '.1.3.6.1.4.1.2021.8.1.101.2', dest: 'sensor/radiation/cpm' },
         { host: 'garlic', oid: '.1.3.6.1.4.1.2021.8.1.101.3', dest: 'sensor/radiation/uSv' },
         { host: 'hazel', oid: '.1.3.6.1.4.1.2021.8.1.101.1', dest: 'sensor/temperature/misc/cnc' },
         { host: 'hazel', oid: '.1.3.6.1.4.1.2021.8.1.101.2', dest: 'sensor/temperature/misc/rack' },
         { host: 'hazel', oid: '.1.3.6.1.4.1.2021.8.1.101.3', dest: 'sensor/temperature/misc/restroom' },
         { host: 'potato', oid: '.1.3.6.1.4.1.2021.8.1.101.1', dest: 'sensor/temperature/lounge/podest' },
         { host: 'potato', oid: '.1.3.6.1.4.1.2021.8.1.101.2', dest: 'sensor/temperature/misc/outdoor' },
         { host: 'potato', oid: '.1.3.6.1.4.1.2021.8.1.101.3', dest: 'sensor/temperature/lounge/ceiling' }
      ]
   }
};
