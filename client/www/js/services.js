angular.module('starter.services', [])

.factory('twitterService', ['$auth', '$http', '$q', 'WikiDprServiceUrl', function($auth, $http, $q, WikiDprServiceUrl) {
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
.factory('wikiDprService', function($http, $q, WikiDprServiceUrl) {
    var result = [];
    var searchUrl = WikiDprServiceUrl + "/api/wikidpr/anggota";
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
                deferred.reject();
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
