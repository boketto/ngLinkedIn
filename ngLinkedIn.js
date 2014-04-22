/**
 * Angular LinkedIn Service
 *
 * For more info see official API Documentation:
 * https://developer.linkedin.com/documents/javascript-api-reference-0
 */
'use strict';

angular.module('ngLinkedIn', [])
    .provider('$linkedIn', function() {
        var config = {
            appKey: null,
            onLoad: null,
            authorize: false,
            lang: 'en_US',
            scope: 'r_basicprofile'
        };

        this.set = function(property, value) {
            if (!config.hasOwnProperty(property)) {
                throw 'Config does not support property: ' + key;
            }
            config[property] = value;
            return this;
        };

        this.get = function(property) {
            if (!config.hasOwnProperty(property)) {
                throw 'Config does not support property: ' + key;
            }
            return config[property];
        };

        this.$get = ['$rootScope', '$q', '$window', function($rootScope, $q, $window) {
            var $linkedIn = $q.defer();

            $rootScope.$on("in.load", function(e, IN) {
                $linkedIn.resolve(IN);

                var events = ['auth', 'logout'];
                angular.forEach(events, function(event) {
                    IN.Event.on(IN, event, function(response) {
                        $rootScope.$broadcast("in." + event, response);
                        if(!$rootScope.$$phase) {
                            $rootScope.$apply();
                        }
                    });
                });
            });

            $linkedIn.config = function(property) {
                return config[property];
            };


            // init
            $linkedIn.init = function() {
                if (!$linkedIn.config('appKey')) {
                    throw '$linkedInProvider: appKey is not set';
                }
                $window.IN.init(angular.extend({ api_key: $linkedIn.config('appKey') }, config));
                $rootScope.$broadcast("in.load", $window.IN);
            };

            // check auth
            $linkedIn.isAuthorized = function() {
                return IN.User.isAuthorized();
            };

            // authorize
            $linkedIn.authorize = function() {
                var defer = $q.defer();

                return $linkedIn.promise.then(function(IN) {
                    IN.User.authorize(function() {
                        defer.resolve();
                    });
                    return defer.promise;
                });
            };

            // refresh token
            $linkedIn.refresh = function() {
                IN.User.refresh();
            };

            // logout
            $linkedIn.logout = function() {
                var defer = $q.defer();
                return $linkedIn.promise.then(function(IN) {
                    IN.User.logout(function() {
                        defer.resolve();
                    });
                    return defer.promise;
                });
            };

            // share
            $linkedIn.share = function(url) {
                if (!url) {
                    throw 'Url is not specified';
                }
                IN.UI.Share()
                    .params({ url: url })
                    .place();
            };

            // general api request
            $linkedIn.api = function(api, ids, fields, params) {
                var defer = $q.defer();
                return $linkedIn.promise.then(function(IN) {
                    IN.API[api](ids.toString() || 'me')
                        .fields(fields || null)
                        .params(params || {})
                        .result(function(response) {
                            console.log('res', response);
                            defer.resolve(response);
                        });
                    return defer.promise;
                });
            };

            // api shortcut methods
            // profile
            $linkedIn.profile = function(ids, fields, params) {
                return $linkedIn.api('Profile', ids, fields, params);
            };

            // connections
            // requires 'r_network' and 'rw_nus' permission
            $linkedIn.connections = function(ids, fields, params) {
                return $linkedIn.api('Connections', ids, fields, params);
            };

            // member updates
            // requires 'rw_nus' permission
            $linkedIn.memberUpdates = function(ids, fields, params) {
                return $linkedIn.api('MemberUpdates', ids, fields, params);
            };

            return $linkedIn;
        }];
    })
    .run(['$rootScope', '$linkedIn', function($rootScope, $linkedIn) {
        $.getScript("//platform.linkedin.com/in.js?async=true", function() {
            $linkedIn.init();
            if (!$rootScope.$$phase) {
                $rootScope.$apply();
            }
        });
    }]);