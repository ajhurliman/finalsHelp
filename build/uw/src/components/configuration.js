angular.module("ApplicationConfiguration", [])

.constant("versionInfo", {
	"version": "0.0.1",
	"date": "08/1/2015 10:51 AM",
	"branch": "origin/master",
	"commit": "123"
})

.constant("Configuration", {
	"timeoutInMillis": 15000,
	"tokenTimeout": 900000,
	"companyCode": "UW",
	"appName": "uw"
})

;