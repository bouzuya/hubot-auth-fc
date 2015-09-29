// auth-fc
//   A Hubot script
//
// Configuration:
//   HUBOT_AUTH_FC_ACCESS_KEY_ID
//   HUBOT_AUTH_FC_SECRET_ACCESS_KEY
//   HUBOT_AUTH_FC_REGION
//   HUBOT_AUTH_FC_BUCKET
//   HUBOT_AUTH_FC_KEY
//
// Commands:
//   None
//
// Author:
//   bouzuya <m@bouzuya.net>
//
var MyS3, Promise, aws, setRoles;

aws = require('aws-sdk');

Promise = require('es6-promise').Promise;

MyS3 = (function() {
  function MyS3(config) {
    var ref;
    this.s3 = new aws.S3({
      apiVersion: '2006-03-01',
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: (ref = config.region) != null ? ref : 'ap-northeast-1'
    });
  }

  MyS3.prototype.fetch = function(arg) {
    var bucket, key;
    bucket = arg.bucket, key = arg.key;
    return new Promise((function(_this) {
      return function(resolve, reject) {
        var params;
        params = {
          Bucket: bucket,
          Key: key
        };
        return _this.s3.getObject(params, function(err, data) {
          if (err != null) {
            return reject(err);
          } else {
            return resolve(data.Body);
          }
        });
      };
    })(this));
  };

  return MyS3;

})();

setRoles = function(robot, users) {
  users.forEach(function(user) {
    var u;
    if (user.name == null) {
      return robot.logger.warning("name prop does not exist");
    }
    u = robot.brain.userForName(user.name);
    if (u == null) {
      return robot.logger.warning(user.name + " does not exist");
    }
    return u.roles = user.repositories.map(function(repo) {
      return 'merge-' + repo;
    });
  });
  return null;
};

module.exports = function(robot) {
  return robot.brain.on('loaded', function() {
    var config, s3;
    config = {
      accessKeyId: process.env.HUBOT_AUTH_FC_ACCESS_KEY_ID,
      secretAccessKey: process.env.HUBOT_AUTH_FC_SECRET_ACCESS_KEY,
      region: process.env.HUBOT_AUTH_FC_REGION,
      bucket: process.env.HUBOT_AUTH_FC_BUCKET,
      key: process.env.HUBOT_AUTH_FC_KEY
    };
    s3 = new MyS3({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region
    });
    return s3.fetch({
      bucket: config.bucket,
      key: config.key
    }).then(function(data) {
      var e, error;
      try {
        return JSON.parse(data);
      } catch (error) {
        e = error;
        return robot.logger.error(config.bucket + " " + config.key + " can't parse as JSON");
      }
    }).then(function(json) {
      return setRoles(robot, json);
    })["catch"](function(e) {
      return robot.logger.error(e);
    });
  });
};
