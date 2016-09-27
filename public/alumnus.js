var alumnus = angular.module('alumnus', []);

alumnus.controller('mainController', function ($scope, $http, $interval) {
    $scope.requestProcessing = {"total": null, "processed": null};
    var intervalFn;
    var finishCounter = 0;

    $scope.beginRequestProcessingCheck = function() {
        intervalFn = $interval(function() {
            $http({method: "GET", url: "/api/requestProcessing"})
                .success(function(result) {
                    console.log(result);
                    if (result["total"] == -1) {
                        ++finishCounter;
                        if (finishCounter > 10) {
                            $scope.stopRequestProcessingCheck();
                            alert("Your job has been completed!");
                        }
                    }
                    else {
                        $scope.requestProcessing = result;
                        finishCounter = 0;
                    }
                })
                .error(function(error) {
                    console.log(error);
                    $scope.stopRequestProcessingCheck();
                });
        }, 500);
    };

    $scope.stopRequestProcessingCheck = function() {
        $interval.cancel(intervalFn);
        finishCounter = 0;
        $scope.requestProcessing = {"total": null, "processed": null};
    };

    $scope.$on('$destroy', function() {
        // Make sure that the interval is destroyed too
        $scope.stopRequestProcessingCheck();
    });
});
