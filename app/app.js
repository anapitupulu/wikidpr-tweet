'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('myApp', [
  'ngRoute',
  'ui.bootstrap'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/view1'});
}]).
filter('extractTwitterId', function() {
    return function(twitterId) {
        twitterId = twitterId || '';
        if (twitterId.length == 0) {
            return '<span style="font-style: italic">twitter not found</span>';
        }
        return "@" + twitterId;
    };
}).
constant('maxTweetChars', 140);
