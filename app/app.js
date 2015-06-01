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
    return function(twitterUrl) {
        twitterUrl = twitterUrl || '';
        if (twitterUrl.length == 0) {
            return '<span style="font-style: italic">twitter not found</span>';
        }
        var tokenizedTwitterUrl = twitterUrl.split("/");
        var twitterId = tokenizedTwitterUrl[tokenizedTwitterUrl.length-1];
        return "@" + twitterId;
    };
}).
constant('maxTweetChars', 140);
