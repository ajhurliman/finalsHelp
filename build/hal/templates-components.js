!function(a){try{a=angular.module("templates-components")}catch(n){a=angular.module("templates-components",[])}a.run(["$templateCache",function(a){a.put("directives/mainHeader/mainHeader.tpl.html",'<header class="main-header">\n  <a ui-sref="home" target="_blank">\n    <img id="logo-main" src="./assets/images/finalhelp160.png" alt="">\n  </a>\n\n  <nav id="navbar-primary" class="navbar navbar-default">\n    <div class="container-fluid">\n      <div class="navbar-header">\n        <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#navbar-primary-collapse">\n          <span class="sr-only">Toggle Navigation</span>\n          <span class="icon-bar">1</span>\n          <span class="icon-bar">2</span>\n          <span class="icon-bar">3</span>\n        </button>\n      </div>\n      <div class="collapse navbar-collapse">\n        <ul class="nav navbar-nav">\n          <!-- <li class="active"><a ui-sref="home" class="nav-item">Home</a></li> -->\n          <!-- <li><a ui-sref="findAndEdit" class="nav-item">Find And Edit</a></li> -->\n          <li><a ui-sref="landing" class="nav-item">Login</a></li>\n          <li><a ui-sref="search" class="nav-item">Find Papers</a></li>\n        </ul>\n      </div> <!-- /navbar-collapse -->\n    </div>  <!-- /container-fluid -->\n  </nav>\n    \n</header>\n  ')}])}(),function(a){try{a=angular.module("templates-components")}catch(n){a=angular.module("templates-components",[])}a.run(["$templateCache",function(a){a.put("directives/modals/showPdfModal/showPdfModal.tpl.html",'<div class="modal-header">\n  <span class="glyphicon glyphicon-remove pull-right" ng-click="close()"></span>\n  <p>ID: {{ paper._id }}</p>\n  <p>Title: {{ paper.title }}</p>\n</div>\n\n\n<canvas id="{{ modalId }}"></canvas>')}])}();