!function(){"use strict"}(),angular.module("fh",["ngStorage","ui.router","ui.bootstrap","ui.bootstrap.showErrors","ui.utils","restangular","templates-app","templates-components","ApplicationConfiguration","fh.landing","fh.home","fh.search","fh.findAndEdit","fh.directives.mainHeader","fh.directives.modals.showPdfModal","fh.services.FocusService","vendor.steelToe","base64","angular-momentjs"]).config(["$urlRouterProvider","RestangularProvider","Configuration","$uiViewScrollProvider","$httpProvider",function(t,e,o,i,n){e.setBaseUrl("/api"),e.setDefaultHttpFields({withCredentials:!0,timeout:o.timeoutInMillis,cache:!0}),t.when("","/landing").otherwise("/landing"),i.useAnchorScroll()}]).run(["$rootScope","Configuration","$state","$sessionStorage",function(t,e,o,i){t.appName=e.appName,t.companyCode=e.companyCode,o.go("landing"),t.$on("$stateChangeStart",function(t,e,o,i,n){})}]).constant("AUTH_EVENTS",{loginSuccess:"auth-login-success",loginFailed:"auth-login-failed",logoutSuccess:"auth-logout-success",sessionTimeout:"auth-session-timeout",notAuthenticated:"auth-not-authenticated",notAuthorized:"auth-not-authorized"});
angular.module("fh.findAndEdit",["ui.select","ngStorage"]).config(["$stateProvider",function(e){e.state("findAndEdit",{url:"/findAndEdit",views:{main:{controller:"FindAndEditController",templateUrl:"findAndEdit/findAndEdit.tpl.html"}},pageTitle:"Find And Edit",resolve:{allClasses:["$http","$sessionStorage",function(e,n){return e({method:"GET",url:"api/classes/all",headers:{jwt:n.jwt}}).then(function(e){return e.data},function(e){console.log(e)})}]}})}]).controller("FindAndEditController",["$scope","$http","$sessionStorage","allClasses","$timeout",function(e,n,t,o,a){function d(e){var n=document.getElementById(e._id),t=n.getContext("2d");e?PDFJS.getDocument(e.img.data).then(function(e){e.getPage(1).then(function(e){var o=.4,a=e.getViewport(o);n.height=a.height,n.width=a.width;var d={canvasContext:t,viewport:a};e.render(d)})}):t.clearRect(0,0,n.width,n.height)}var i="/api/papers";n.defaults.headers.common.jwt=t.jwt,e.query={},e.editData={},e.allClasses=o,e.seasons=[{name:"Spring",code:"SP"},{name:"Summer",code:"SU"},{name:"Fall",code:"FA"},{name:"Winter",code:"WI"}],e.years=[{name:"95",code:"95"},{name:"96",code:"96"},{name:"97",code:"97"},{name:"98",code:"98"},{name:"99",code:"99"},{name:"00",code:"00"},{name:"01",code:"01"},{name:"02",code:"02"},{name:"03",code:"03"},{name:"04",code:"04"},{name:"05",code:"05"},{name:"06",code:"06"},{name:"07",code:"07"},{name:"08",code:"08"},{name:"09",code:"09"},{name:"10",code:"10"},{name:"11",code:"11"},{name:"12",code:"12"},{name:"13",code:"13"},{name:"14",code:"14"},{name:"15",code:"15"}],e.types=[{name:"Homework",code:"H"},{name:"Midterm",code:"M"},{name:"Notes",code:"N"},{name:"Quiz",code:"Q"},{name:"Final",code:"F"},{name:"Lab",code:"L"}],e.findClasses=function(t){n({method:"GET",url:i+"/classAndType/class/"+t.classId}).then(function(n){e.papers=n.data},function(e){console.log(e)})},e.$watch("papers",function(){e.papers&&a(function(){for(var n=0;n<e.papers.length;n++)d(e.papers[n])},100)}),e.showEditPanel=function(n){e["openEditPanel-"+n]=!e["openEditPanel-"+n]},e.isEditPanelOpen=function(n){return!!e["openEditPanel-"+n]},e.submitEditedPaper=function(e,t){putObj={title:t.title,period:t.season+t.year,type:t.type,classId:t.classId},e.success=n({method:"PUT",url:"api/papers/single/"+e._id,data:putObj}).then(function(e){return console.log(e),!0},function(e){return console.error(e),!1})}}]);
angular.module("fh.home",["ui.select","ngStorage","ngFileUpload","fh.services.FocusService"]).config(["$stateProvider",function(e){e.state("home",{url:"/home",views:{main:{controller:"HomeController",templateUrl:"home/home.tpl.html"}},pageTitle:"Home",resolve:{allClasses:["$http","$sessionStorage",function(e,t){return e({method:"GET",url:"api/classes/all",headers:{jwt:t.jwt}}).then(function(e){return e.data},function(e){console.log(e)})}],tokens:["$http",function(e){return e({method:"GET",url:"assets/tokens.json"}).then(function(e){return e.data},function(e){console.log(e)})}]}})}]).controller("HomeController",["$scope","$http","$sessionStorage","$timeout","giveFocus","Upload","allClasses","tokens",function(e,t,o,n,a,i,c,s){var l="/api/papers";t.defaults.headers.common.jwt=o.jwt,e.allClasses=c,e.$watch("files",function(){e.upload(e.files)}),e.$watch("file",function(){null!=e.file&&e.upload([e.file])}),e.log="",e.papersToEdit=[],e.editData={},e.seasons=[{name:"Spring",code:"SP"},{name:"Summer",code:"SU"},{name:"Fall",code:"FA"},{name:"Winter",code:"WI"}],e.years=[{name:"95",code:"95"},{name:"96",code:"96"},{name:"97",code:"97"},{name:"98",code:"98"},{name:"99",code:"99"},{name:"00",code:"00"},{name:"01",code:"01"},{name:"02",code:"02"},{name:"03",code:"03"},{name:"04",code:"04"},{name:"05",code:"05"},{name:"06",code:"06"},{name:"07",code:"07"},{name:"08",code:"08"},{name:"09",code:"09"},{name:"10",code:"10"},{name:"11",code:"11"},{name:"12",code:"12"},{name:"13",code:"13"},{name:"14",code:"14"},{name:"15",code:"15"}],e.types=[{name:"Homework",code:"H"},{name:"Midterm",code:"M"},{name:"Notes",code:"N"},{name:"Quiz",code:"Q"},{name:"Final",code:"F"},{name:"Lab",code:"L"}],e.upload=function(t){if(t&&t.length)for(var o=0;o<t.length;o++){var c=t[o];i.upload({url:l,file:c}).progress(function(t){var o=parseInt(100*t.loaded/t.total);e.log="progress: "+o+"%"+t.config.file.name+"\n"+e.log}).success(function(t,o,i,c){n(function(){e.log="file: "+c.file.name+", Response: "+JSON.stringify(t.title)+", ID: "+t._id,"\n"+e.log,e.papersToEdit.push(t),a("season-picker")})})}},e.submitEditedPaper=function(o,n){putObj={title:n.title,period:n.season+n.year,type:n.type,classId:n.classId},t({method:"PUT",url:"api/papers/single/"+o._id,data:putObj}).then(function(t){console.log(t),e.paperToEditBackStore=e.papersToEdit.shift()},function(e){console.error(e)})},e.$watch("papersToEdit[0]",function(){var t=document.getElementById("main-viewer"),o=t.getContext("2d");e.papersToEdit[0]?PDFJS.getDocument(e.papersToEdit[0].img.data).then(function(e){e.getPage(1).then(function(e){var n=.8,a=e.getViewport(n);t.height=a.height,t.width=a.width;var i={canvasContext:o,viewport:a};e.render(i)})}):o.clearRect(0,0,t.width,t.height)}),e.$watch("papersToEdit[1]",function(){var t=document.getElementById("next-up-pdf-container"),o=t.getContext("2d");e.papersToEdit[1]?PDFJS.getDocument(e.papersToEdit[1].img.data).then(function(e){e.getPage(1).then(function(e){var n=.2,a=e.getViewport(n);t.height=a.height,t.width=a.width;var i={canvasContext:o,viewport:a};e.render(i)})}):o.clearRect(0,0,t.width,t.height)}),e.addClass=function(o){var n={title:o};t({method:"POST",url:"/api/classes",data:n}).then(function(o){t({method:"GET",url:"/api/classes/all"}).then(function(t){e.allClasses=t.data})},function(e){console.log(e)})}}]);
angular.module("fh.landing",["ngStorage"]).config(["$stateProvider",function(e){e.state("landing",{url:"/",views:{main:{controller:"LandingController",templateUrl:"landing/landing.tpl.html"}},pageTitle:"landingPage.pageTitle"})}]).controller("LandingController",["$scope","$state","$http","$base64","$sessionStorage",function(e,o,r,n,a){var t="/api/users";e.register=function(n){if(!(n.name&&n.email&&n.password&&n.passwordConfirm&&n.addCode))return void(e.registrationError="Please complete the form before submitting");var i={name:n.name,phone:n.phone,email:n.email,password:n.password,passwordConfirm:n.passwordConfirm,token:n.addCode};r({method:"POST",url:t,headers:{"Content-Type":"application/json"},data:i}).success(function(e){console.dir(e),a.jwt=e.jwt,o.go("search")}).error(function(o){e.registrationError=o,console.dir(o),e.registerCredentials.password="",e.registerCredentials.passwordConfirm=""})},e.login=function(i){r.defaults.headers.common.Authorization="Basic "+n.encode(i.email+":"+i.password),r.get(t).success(function(e){console.dir(e),a.jwt=e.jwt,o.go("search")}).error(function(o){e.loginError=o,console.dir(o)})}}]);
angular.module("fh.search",["ui.select","cgBusy","ngStorage","smart-table"]).config(["$stateProvider",function(e){e.state("search",{url:"/search",views:{main:{controller:"SearchController",templateUrl:"search/search.tpl.html"}},pageTitle:"Search"})}]).controller("SearchController",["$rootScope","$scope","$http","$sessionStorage","$timeout",function(e,r,t,o,a){function n(e){return e?e.map(function(e){var r,t=e.period.slice(0,2),o=e.period.slice(2,4);switch(t){case"WI":r=0;break;case"SP":r=3;break;case"SU":r=6;break;case"FA":r=9}return o=parseInt(o),o+=80>o?2e3:1900,e.period=new Date(o,r,1),e}):void 0}t.defaults.headers.common.jwt=o.jwt,r.reverse=!0,r.predicate="period",r.rendered=!1,r.query={};var s="/api/papers";r.sortPeriod={active:!0,reverse:!0},r.sortType={active:!1,reverse:!1};t({method:"GET",url:"api/classes/all"}).then(function(e){r.allClasses=e.data},function(e){console.log(e)}),r.togglePeriodReverse=function(){r.sortType.active=!1,r.sortType.reverse=!1,r.sortPeriod.active=!0,r.sortPeriod.reverse=!r.sortPeriod.reverse},r.toggleTypeReverse=function(){r.sortPeriod.active=!1,r.sortPeriod.reverse=!0,r.sortType.active=!0,r.sortType.reverse=!r.sortType.reverse},r.hoverInOrOut=function(){this.hoverEdit=!this.hoverEdit},r.findPapersByClass=function(e){r.busyFindingPapers=t({method:"GET",url:s+"/class/"+e.classId}).then(function(e){r.papers=n(e.data)},function(e){console.log(e)})},r.findImage=function(e){r.busyFindingPaperImage=t({method:"GET",url:s+"/single/"+e}).then(function(e){r.paperToRender=e.data},function(e){console.log(e)})},r.$watch("paperToRender",function(){r.paperToRender&&a(function(){e.$broadcast("pdf-ready-to-render")},100)})}]).filter("periodFilter",function(){return function(e){{var r,t=e.getFullYear();new Date(t,0,1),new Date(t,3,1),new Date(t,6,1),new Date(t,9,1)}switch(e.getMonth()){case 0:r="WI";break;case 3:r="SP";break;case 6:r="SU";break;case 9:r="FA"}var o=e.getFullYear().toString();return o=o.slice(2,4),""+r+o}}).filter("typeFilter",function(){return function(e){switch(e){case"H":return"Homework";case"M":return"Midterm";case"N":return"Notes";case"Q":return"Quiz";case"F":return"Final";case"L":return"Lab"}}});
angular.module("fh.directives.mainHeader",["ngStorage","ApplicationConfiguration"]).directive("mainHeader",function(){return{restrict:"A",replace:!0,templateUrl:"directives/mainHeader/mainHeader.tpl.html",controller:["$scope","$state",function(e,r){}]}});
angular.module("fh.directives.modals.showPdfModal",["ui.bootstrap","fh.services.ModalService"]).directive("showPdfModal",["ModalService","$http",function(e,t){return{restrict:"AE",link:function(o,n,d){n.on("click",function(){e.openModal({templateUrl:"directives/modals/showPdfModal/showPdfModal.tpl.html",controller:"ShowPdfModalController",windowClass:"show-pdf-modal",backdrop:"static",keyboard:!1,resolve:{paperToRender:function(){return t({method:"GET",url:"/api/papers/single/"+o.paper._id}).then(function(e){return e.data},function(e){console.log(e)})}}})})}}}]).controller("ShowPdfModalController",["$scope","$timeout","ModalService","paperToRender",function(e,t,o,n){function d(t){var o=document.getElementById("rendered-pdf-modal"),n=o.getContext("2d");e.pdf.getPage(t).then(function(e){var t=1,d=e.getViewport(t);o.height=d.height,o.width=d.width;var a={canvasContext:n,viewport:d};e.render(a)})}e.close=function(){o.closeModal()};e.paperToRender=n,t(function(){var t=document.getElementById("rendered-pdf-modal"),o=t.getContext("2d");n?PDFJS.getDocument(n.img.data).then(function(n){n.getPage(1).then(function(e){var n=1,d=e.getViewport(n);t.height=d.height,t.width=d.width;var a={canvasContext:o,viewport:d};e.render(a)}),e.pdf=n,e.page=1,document.getElementById("previous-page-modal").addEventListener("click",function(){e.page>1&&(e.page--,d(e.page))}),document.getElementById("next-page-modal").addEventListener("click",function(){e.pdf.numPages>e.page&&(e.page++,d(e.page))})}):o.clearRect(0,0,t.width,t.height)},50)}]);
angular.module("fh.services.FindImageService",["ngStorage","vendor.steelToe"]).factory("FindImageService",["$http","$sessionStorage","$q","steelToe",function(e,r,n,o){function a(e,r){var o=n.defer(),a=new Image;return a.onerror=function(){o.resolve(r)},a.onload=function(){o.resolve(e)},a.src=e,o.promise}return{getHeaderImage:function(e){var r="./assets/images/headerImage.jpg";return a(r)}}}]);
angular.module("fh.services.FocusService",[]).factory("giveFocus",["$timeout",function(e){return function(u){e(function(){var e=document.getElementById(u);e&&e.focus()})}}]);
angular.module("fh.services.ModalService",["ui.bootstrap.modal"]).service("ModalService",["$rootScope","$modal",function(l,o){var a={modal:null,modalArgs:null,isModalOpen:function(){return null!==a.modal},openModal:function(l){return a.closeModal(),a.modalArgs=l,a.modal=o.open(l),a.modal},closeModal:function(){return null===a.modal?!1:(a.modal.dismiss(),a.modal=null,a.modalArgs=null,!0)}};return l.$on("$stateChangeStart",function(l,o,n,e,d){a.closeModal()}),a}]);