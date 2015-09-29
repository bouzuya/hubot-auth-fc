# auth-fc
#   A Hubot script
#
# Configuration:
#   HUBOT_AUTH_FC_ACCESS_KEY_ID
#   HUBOT_AUTH_FC_SECRET_ACCESS_KEY
#   HUBOT_AUTH_FC_REGION
#   HUBOT_AUTH_FC_BUCKET
#   HUBOT_AUTH_FC_KEY
#
# Commands:
#   None
#
# Author:
#   bouzuya <m@bouzuya.net>
#
aws = require 'aws-sdk'
{Promise} = require 'es6-promise'

class MyS3
  constructor: (config) ->
    @s3 = new aws.S3
      apiVersion: '2006-03-01'
      accessKeyId: config.accessKeyId
      secretAccessKey: config.secretAccessKey
      region: config.region ? 'ap-northeast-1'

  fetch: ({ bucket, key }) ->
    new Promise (resolve, reject) =>
      params =
        Bucket: bucket
        Key: key
      @s3.getObject params, (err, data) ->
        if err?
          reject err
        else
          resolve data.Body

# users = [
#   name: 'user name'
#   repositories: ['repo name']
# ]
setRoles = (robot, users) ->
  users.forEach (user) ->
    return robot.logger.warning("name prop does not exist") unless user.name?
    u = robot.brain.userForName user.name
    return robot.logger.warning("#{user.name} does not exist") unless u?
    u.roles = user.repositories.map (repo) -> 'merge-' + repo
  null

module.exports = (robot) ->
  robot.brain.on 'loaded', ->
    config =
      accessKeyId: process.env.HUBOT_AUTH_FC_ACCESS_KEY_ID
      secretAccessKey: process.env.HUBOT_AUTH_FC_SECRET_ACCESS_KEY
      region: process.env.HUBOT_AUTH_FC_REGION
      bucket: process.env.HUBOT_AUTH_FC_BUCKET
      key: process.env.HUBOT_AUTH_FC_KEY
    s3 = new MyS3
      accessKeyId: config.accessKeyId
      secretAccessKey: config.secretAccessKey
      region: config.region
    s3.fetch
      bucket: config.bucket
      key: config.key
    .then (data) ->
      try
        JSON.parse data
      catch e
        robot.logger.error "#{config.bucket} #{config.key} can't parse as JSON"
    .then (json) ->
      setRoles robot, json
    .catch (e) ->
      robot.logger.error e
