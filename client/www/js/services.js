angular.module('starter.services', [])

.factory('oauthTwitterService', function($q) {

    var oauthHandle = null;
    var connected = false; 

    return {
        initialize: function() {
            //initialize OAuth.io with public key of the application
            OAuth.initialize('7fJaEiehtRcguYmajy-uxDekk8U', {cache:true});
            //try to create an authorization result when the page loads, this means a returning user won't have to click the twitter button again
            oauthHandle = OAuth.create('twitter');
            if (oauthHandle !== false) {
                connected = true;
            }
        },
        isReady: function() {
            return (connected);
        },
        connectTwitter: function() {
            var deferred = $q.defer();
            OAuth.popup('twitter', {cache:true}).done(function(twitter) { //cache means to execute the callback if the tokens are already present
                connected = true;
                oauthHandle = twitter;
                deferred.resolve();
            }).fail(function (error) {
                console.log(error);
            });
            return deferred.promise;
        },
        clearCache: function() {
            OAuth.clearCache('twitter');
            connected = false;
        },
        getUserLatestTweets: function () {
            //create a deferred object using Angular's $q service
            var deferred = $q.defer();
            var promise = oauthHandle.get('/1.1/statuses/user_timeline.json?count=3').done(function(data) { //https://dev.twitter.com/docs/api/1.1/get/statuses/home_timeline
                //when the data is retrieved resolved the deferred object
                deferred.resolve(data)
            });
            //return the promise of the deferred object
            return deferred.promise;
        },
        getUserInfo: function() {
            var deferred = $q.defer();
            var promise = oauthHandle.get('1.1/account/verify_credentials.json').done(function(data) {
                deferred.resolve(data)
            });

            return deferred.promise;
        },
        postTweet: function(tweetText) {
            var deferred = $q.defer();
            var promise = oauthHandle.post('1.1/statuses/update.json', {
                data: {
                    status: tweetText
                }
            }).done(function(data) {
                deferred.resolve();
            });
            return deferred.promise;
        }
    }
})
.factory('twitterService', ['$auth', '$http', '$q', '$window', 'WikiDprServiceUrl', function($auth, $http, $q, $window, WikiDprServiceUrl) {
    var token = "";
    var connected = false;

    return {

        initialize: function() {
            if ($auth.isAuthenticated()) {
                token = $auth.getToken();
            }
        },

        isReady: function() {
            return $auth.isAuthenticated();
        },

        connectTwitter: function() {
            var deferred = $q.defer();
            $auth.authenticate('twitter').then(function(data) {
                token = data;
                deferred.resolve();
            });
            return deferred.promise;
        },

        clearCache: function() {
            $auth.logout();
            token = "";
        },

        postTweet: function(tweetText) {
            var tweetText = "@wikidpr test";
            var deferred = $q.defer();
            $http(
                {
                    method: "post",
                    url: WikiDprServiceUrl + '/api/twitter/statuses/update',
                    data: {
                        status: tweetText
                    }, 
                    headers: {
                        'Authorization': $auth.getToken()
                    }
                }
            ).success(function (data) {
                deferred.resolve();
            });

            return deferred.promise;
        }
    };
}]) 
.factory('wikiDprService', function($http, $q, WikiDprApiUrl) {
    var result = [];
    // var searchUrl = "http://wikidpr.org/api/v2/anggota";
    var searchUrl = "/wikidprapi";
    var anggotaSelected = {};

    return {
        searchAnggota: function(anggotaName, komisiValue) {
            var deferred = $q.defer();
            $http.get(searchUrl, { params: { s: anggotaName, komisi: komisiValue } }).
                success(function (response) {
                result = response.data;
                deferred.resolve(result);
            }).
                error(function (data, status) {
                console.error('Repos error', status, data);
            });
            return deferred.promise;
        },

        setAnggotaSelected: function(anggota) {
            anggotaSelected = anggota;
        },

        getAnggotaSelected: function() {
            return anggotaSelected;
        }
    };
});
