//inject the twitterService into the controller
angular.module('myApp')

.controller('WikiDprTweetController', ['$scope', '$q', 'twitterService', '$http', function($scope, $q, twitterService, $http) {

    twitterService.initialize();

    $scope.tweetText = '';
    $scope.attr = {
        userLoggedIn: twitterService.isReady(),
        username: "",
        latestTweets: [],
        tweetTextLimitStyle: ""
    };

    var initializeLoggedIn = function() {
        twitterService.getUserInfo().then(function (userInfo) {
            $scope.attr.username = userInfo.screen_name;
        });

        twitterService.getUserLatestTweets().then(function (latestTweets) {
            $scope.attr.latestTweets = latestTweets;
        });
    }

    if ($scope.attr.userLoggedIn) {
        initializeLoggedIn();
    }

    //when the user clicks the connect twitter button, the popup authorization window opens
    $scope.connectButton = function() {
        twitterService.connectTwitter().then(function() {
            if (twitterService.isReady()) {
                //if the authorization is successful, hide the connect button and display the tweets
                $scope.attr.userLoggedIn = true;
                initializeLoggedIn();
            }
        });
    };

    $scope.signOut = function() {
        twitterService.clearCache();
        $scope.attr.userLoggedIn = false;
        $scope.attr.username = "";
    };

    $scope.findAnggota = function(anggota) {
        var searchUrl = 'http://wikidpr.org/api/v2/anggota';
        return $http.get(searchUrl, {
            params: { s: anggota }
        }).then(function (response) {
            return response.data.data;
        });
    };

    $scope.onAnggotaSelected = function($item, $model, $label) {
       var tokenizedTwitterUrl = $item.twitter.split("/");
       var twitterId = tokenizedTwitterUrl[tokenizedTwitterUrl.length-1];
       var komisi = $item.komisi;
       var partai = $item.partai

       $scope.tweetText = "@" + twitterId + " " + "#" + partai + " #Komisi" + komisi + " ";
    };

    $scope.submitTweet = function(tweetText) {
        twitterService.postTweet(tweetText).then(function() {
            twitterService.getUserLatestTweets().then(function (latestTweets) {
                $scope.attr.latestTweets = latestTweets;
                $scope.anggotaSelected = "";
                $scope.tweetText = "";
            });
        });
    }

    $scope.isTextLimitHit = function() {
        if ($scope.tweetText.length > 180) {
            $scope.attr.tweetTextLimitStyle = { "color": "red" };
            return true;
        } else {
            $scope.attr.tweetTextLimitStyle = "";
            return false;
        }
    }
}]);
