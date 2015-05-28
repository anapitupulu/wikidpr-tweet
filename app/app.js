'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('myApp', [
  'ngRoute',
  'myApp.view1',
  'myApp.view2',
  'myApp.version',
  'ui.bootstrap'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/view1'});
}]);

app.controller('homeController', ['$scope', '$http', function ($scope, $http) {

    $scope.komisi = [ 'Komisi I', 'Komisi II', 'Komisi III', 'Komisi IV' ];
    $scope.selectedKomisi = $scope.komisi[0];

    $scope.anggota = [
        { id: 1, name: 'Alex', party: 'Libertarian', district: 'Malang'},
        { id: 2, name: 'Indah', party: 'Democrat', district: 'Jambi' },
        { id: 3, name: 'Zee', party: 'Green', district: 'Bukit Tinggi'},
        { id: 4, name: 'Greg', party: 'Republican', district: 'Jakarta'}
    ];
    $scope.anggotaSelected = "";
    $scope.tweetText = '';

    $scope.$watch('anggotaSelected', function(newValue, oldValue) {
        if (newValue.name !== undefined && newValue.id != oldValue.id) {
            $scope.tweetText = '#' + newValue.name + ' #' + newValue.party + ' #' + newValue.district + ' ';
        }
    });

}]);

app.controller('TwitterController', function($scope, $q, twitterService) {

    $scope.tweets; //array of tweets
    
    twitterService.initialize();

    //using the OAuth authorization result get the latest 20 tweets from twitter for the user
    $scope.refreshTimeline = function() {
        twitterService.getLatestTweets().then(function(data) {
            $scope.tweets = data;
        });
    }

    //when the user clicks the connect twitter button, the popup authorization window opens
    $scope.connectButton = function() {
        twitterService.connectTwitter().then(function() {
            if (twitterService.isReady()) {
                //if the authorization is successful, hide the connect button and display the tweets
                $('#connectButton').fadeOut(function(){
                    $('#getTimelineButton, #signOut').fadeIn();
                    $scope.refreshTimeline();
                });
            }
        });
    }

    //sign out clears the OAuth cache, the user will have to reauthenticate when returning
    $scope.signOut = function() {
        twitterService.clearCache();
        $scope.tweets.length = 0;
        $('#getTimelineButton, #signOut').fadeOut(function(){
            $('#connectButton').fadeIn();
        });
    }

    //if the user is a returning user, hide the sign in button and display the tweets
    if (twitterService.isReady()) {
        $('#connectButton').hide();
        $('#getTimelineButton, #signOut').show();
        $scope.refreshTimeline();
    }

});
