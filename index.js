'use strict';

var io = require('socket.io-client');
var libQ = require('kew');
var fs = require('fs-extra');
var Gpio = require('onoff').Gpio;
var raspdacDisplay = require('./raspdacDisplay');

// Define the ControllerRaspDac class
module.exports = ControllerRaspDac;

function ControllerRaspDac(context) {
      // This fixed variable will let us refer to 'this' object at deeper scopes
      var self = this;

      self.context = context;
      self.commandRouter = this.context.coreCommand;
      self.logger = this.context.logger;

      // Set Button GPIO
      self.softShutdown = new Gpio(4, 'out');
      self.shutdownButton = new Gpio(17, 'in', 'both');
      self.bootOk = new Gpio(22, 'high');

      self.shutdownButton.watch(self.hardShutdownRequest.bind(this));

      // Use loggin filters for soft reboot watcher
      self.logger.filters.push(function(level, msg) {
            var self = this;
            if (msg === 'Shutting Down') {
                  self.raspdacDisplay.close();
                  self.softShutdown.writeSync(1);
                  setTimeout(self.softshutdown.bind(this), 1000);
            }
            else if(msg === 'Rebooting') {
                  self.raspdacDisplay.close();
                  self.softShutdown.writeSync(1);
            }

            return msg;
      });

      // Set LCD
      self.raspdacDisplay = new raspdacDisplay(context);
}

ControllerRaspDac.prototype.onVolumioStart = function()
{
      var self = this;
      self.logger.info("RaspDac initialized");
}

ControllerRaspDac.prototype.getConfigurationFiles = function()
{
      return ['config.json'];
}

ControllerRaspDac.prototype.addToBrowseSources = function () {
      var self = this;
};

// Plugin methods -----------------------------------------------------------------------------
ControllerRaspDac.prototype.onStart = function() {
      var self = this;

      var defer=libQ.defer();

      self.configFile=self.commandRouter.pluginManager.getConfigurationFile(self.context,'config.json');

      //self.applyConf(self.getConf());
      self.logger.info("RaspDac started");
      defer.resolve();

      return defer.promise;
};

ControllerRaspDac.prototype.onStop = function() {
      var self = this;
      self.shutdownButton.unwatchAll();
      self.shutdownButton.unexport();
      self.bootOk.unexport();
      self.softShutdown.unexport();

      self.raspdacDisplay.close();
};

ControllerRaspDac.prototype.onRestart = function() {
      var self = this;
};

ControllerRaspDac.prototype.onInstall = function() {
      var self = this;
      //Perform your installation tasks here
};

ControllerRaspDac.prototype.onUninstall = function() {
      var self = this;
      //Perform your installation tasks here
};

ControllerRaspDac.prototype.stop = function() {
};


ControllerRaspDac.prototype.getConf = function(varName) {
      var self = this;
      this.config = new (require('v-conf'))()
      this.config.loadFile(configFile)

      return libQ.resolve();
};

ControllerRaspDac.prototype.setConf = function(varName, varValue) {
      var self = this;
      //Perform your installation tasks here
};

ControllerRaspDac.prototype.applyConf = function(conf) {
      var self = this;
};

ControllerRaspDac.prototype.getUIConfig = function() {
      var defer = libQ.defer();
      var self = this;

      var lang_code = self.commandRouter.sharedVars.get('language_code');

      self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
            __dirname+'/i18n/strings_en.json',
            __dirname + '/UIConfig.json')
      .then(function(uiconf)
      {
            defer.resolve(uiconf);
      })
      .fail(function()
      {
            defer.reject(new Error());
      });

      return defer.promise;
};

ControllerRaspDac.prototype.setUIConfig = function(data) {
      var self = this;
      self.logger.info("Updating UI config");
      var uiconf = fs.readJsonSync(__dirname + '/UIConfig.json');

      return libQ.resolve();
};

// user_interface plugin Methods
ControllerRaspDac.prototype.pushState = function(state) {
      var self = this;  
      self.raspdacDisplay.pushState(state);
      return libQ.resolve();
}

ControllerRaspDac.prototype.pushQueue = function(state) {
      var self = this;
      return libQ.resolve();
}

// Public Methods ---------------------------------------------------------------------------------------

// Button Management
ControllerRaspDac.prototype.hardShutdownRequest = function(err, value) {
     var self = this;
     self.bootOk.writeSync(1);
     setTimeout( self.hardshutdown.bind(this), 1000);
};

ControllerRaspDac.prototype.hardshutdown = function() {
      var self = this;
      self.bootOk.writeSync(0);
      self.commandRouter.shutdown();
};

ControllerRaspDac.prototype.softshutdown = function() {
      var self = this;
      self.softShutdown.writeSync(0);
};
