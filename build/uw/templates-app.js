!function(e){try{e=angular.module("templates-app")}catch(n){e=angular.module("templates-app",[])}e.run(["$templateCache",function(e){e.put("account/account.tpl.html","<div class='account-page'>\n  <h4>Account Settings</h4>\n\n  <hr>\n\n  <table st-table='userProperties' class='table'>\n    <tbody>\n      <tr>\n        <td><strong>Email</strong></td>\n        <td>{{user.basic.email}}</td>\n"+'        <!-- <td><a href="" class="btn btn-primary">Edit</a></td> -->\n      </tr>\n\n      <tr ng-hide="authSuccess">\n        <td><strong>Password</strong></td>\n\n        <td>\n          <input ng-model="oldPassword" type="password" class="form-control edit-password-input" placeholder="Current Password">\n        </td>\n        \n        <td>\n          <a href="" ng-click="authCheck(oldPassword)" ng-class="editPasswordEnabled()" class="btn btn-primary">Edit</a>\n        </td>\n      </tr>\n\n      <!-- edit email section -->\n      <tr ng-show="authSuccess">\n        <td><strong>Password</strong></td>\n\n        <td ng-show="authSuccess">\n          <input ng-model="newPassword" type="password" class="form-control edit-password-input" placeholder="New Password">\n        </td>\n        \n        <td ng-show="authSuccess">\n          <a href="" ng-click="updatePassword(newPassword, newPasswordConfirm)" ng-class="editPasswordEnabled()" class="btn btn-primary">Submit</a>\n        </td>\n      </tr>\n\n      <tr ng-show="authSuccess">\n        <td></td>\n        <td>\n          <input ng-model="newPasswordConfirm" type="password" class="form-control edit-password-input" placeholder="Confirm New Password">\n        </td>\n        <td></td>\n      </tr>\n\n    </tbody>\n  </table>\n  <div class="col-sm-4 error-message">\n    <div class="alert alert-danger" role="alert" collapse="!updatePasswordError">\n      <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>\n      <span class="sr-only">Error:</span>\n      {{ updatePasswordError }}\n    </div>\n  </div>\n  <div class="col-sm-5"></div>\n  \n  <div class="col-sm-4 error-message">\n    <div class="alert alert-success" role="alert" collapse="!updatePasswordSuccess">\n      <span class="glyphicon glyphicon-ok" aria-hidden="true"></span>\n      <span class="sr-only">Error:</span>\n      {{ updatePasswordSuccess }}\n    </div>\n  </div>\n\n</div>')}])}(),function(e){try{e=angular.module("templates-app")}catch(n){e=angular.module("templates-app",[])}e.run(["$templateCache",function(e){e.put("findAndEdit/findAndEdit.tpl.html",'<div class="find-and-edit-page">\n\n  <div class="row">\n    <div class="col-sm-4">\n      <h1 class="text-left">Find papers</h1>\n    </div>\n  </div>\n\n  <!-- class -->\n  <div class="row">\n    <div class="col-sm-4">\n      <ui-select ng-model="query.classId" theme="bootstrap">\n        <ui-select-match placeholder="Pick a class">{{$select.selected.title}}</ui-select-match>\n        <ui-select-choices repeat="class._id as class in allClasses | filter:$select.search">\n          {{class.title}}\n          <div ng-bind-html="class.title | highlight: $select.search"></div>\n        </ui-select-choices>\n      </ui-select>\n    </div>\n  </div>\n\n  <br>\n\n  <!-- type -->\n  <!-- <div class="row">\n    <div class="col-sm-4">\n      <ui-select ng-model="query.typeCode" theme="bootstrap">\n        <ui-select-match placeholder="Pick a type">{{$select.selected.name}}</ui-select-match>\n        <ui-select-choices repeat="type.code as type in types | filter:$select.search">\n          {{type.name}}\n          <div ng-bind-html="type.name | highlight: $select.search"></div>\n        </ui-select-choices>\n      </ui-select>\n    </div>\n  </div> -->\n\n  <br>\n\n  <div class="row">\n    <div class="col-sm-4">\n      <button class="btn btn-lg btn-block btn-primary" ng-click="findClasses( query )">Go!</button>\n    </div>\n  </div>\n\n  <!-- block grid  -->\n  <div class="block-grid-xs-2 block-grid-sm-3">\n    <div class="block-grid-item search-result-block" ng-repeat="paper in papers">\n\n      <p>Title   : {{ paper.title }}</p>\n      <p>Period  : {{ paper.period }}</p>\n      <p>Type    : {{ paper.type }}</p>\n      <p>User ID : {{ paper.userId }}</p>\n      <p>Class ID: {{ paper.classId }}</p>\n      <p>_id     : {{ paper._id }}</p>\n\n      <span class="glyphicon glyphicon-edit pull-right" ng-click="showEditPanel(paper._id)">\n      </span>\n\n      <div class="edit-panel" collapse="!isEditPanelOpen(paper._id)">\n        <!-- season picker -->\n        <div class="row">\n          <div class="col-sm-12">\n            <ui-select ng-model="editData.season" theme="bootstrap">\n              <ui-select-match placeholder="New season">{{$select.selected.name}}</ui-select-match>\n              <ui-select-choices repeat="season.code as season in seasons | filter:$select.search">\n                {{season.name}}\n                <div ng-bind-html="season.name | highlight: $select.search"></div>\n              </ui-select-choices>\n            </ui-select>\n          </div>\n        </div>\n\n        <!-- year picker -->\n        <div class="row">\n          <div class="col-sm-12">\n            <ui-select ng-model="editData.year" theme="bootstrap">\n              <ui-select-match placeholder="New year">{{$select.selected.name}}</ui-select-match>\n              <ui-select-choices repeat="year.code as year in years | filter:$select.search">\n                {{year.name}}\n                <div ng-bind-html="year.name | highlight: $select.search"></div>\n              </ui-select-choices>\n            </ui-select>\n          </div>\n        </div>\n\n        <!-- type picker -->\n        <div class="row">\n          <div class="col-sm-12">\n            <ui-select ng-model="editData.type" theme="bootstrap">\n              <ui-select-match placeholder="New type">{{$select.selected.name}}</ui-select-match>\n              <ui-select-choices repeat="type.code as type in types | filter:$select.search">\n                {{type.name}}\n                <div ng-bind-html="type.name | highlight: $select.search"></div>\n              </ui-select-choices>\n            </ui-select>\n          </div>\n        </div>\n\n        <!-- class -->\n        <div class="row">\n          <div class="col-sm-12">\n            <ui-select ng-model="editData.classId" theme="bootstrap">\n              <ui-select-match placeholder="New class">{{$select.selected.title}}</ui-select-match>\n              <ui-select-choices repeat="class._id as class in allClasses | filter:$select.search">\n                {{class.title}}\n                <div ng-bind-html="class.title | highlight: $select.search"></div>\n              </ui-select-choices>\n            </ui-select>\n          </div>\n        </div>\n\n        <div class="row">\n          <button class="btn btn-primary btn-block" ng-click="submitEditedPaper( paper, editData )">Make it happen</button>\n        </div>\n\n        <p>\n          <small class="success-tag text-center" collapse="!paper.success">Success!</small>\n        </p>\n          \n      </div>\n\n      <canvas id="{{paper._id}}" show-pdf-modal></canvas>\n\n    </div>\n      \n\n  </div>\n\n\n  \n</div>')}])}(),function(e){try{e=angular.module("templates-app")}catch(n){e=angular.module("templates-app",[])}e.run(["$templateCache",function(e){e.put("home/home.tpl.html",'<div class=\'home-page\'>\n\n  <div class="col-sm-3">\n    Drop File:\n    <div ngf-drop ngf-select ng-model="files" class="drop-box" \n        ngf-drag-over-class="dragover" ngf-multiple="true" ngf-allow-dir="true"\n        accept="image/*,application/pdf">Drop pdfs or images here or click to upload</div>\n    <div ngf-no-file-drop>File Drag/Drop is not supported for this browser</div>\n  </div>\n\n  <div class="col-sm-6">\n    <div class="row">\n      <!-- season picker -->\n      <div class="col-sm-4">\n        <ui-select id="season-picker" ng-model="editData.season" theme="bootstrap">\n          <ui-select-match placeholder="Pick a season">{{$select.selected.name}}</ui-select-match>\n          <ui-select-choices repeat="season.code as season in seasons | filter:$select.search">\n            {{season.name}}\n            <div ng-bind-html="season.name | highlight: $select.search"></div>\n          </ui-select-choices>\n        </ui-select>\n      </div>\n\n      <!-- year picker -->\n      <div class="col-sm-4">\n        <ui-select ng-model="editData.year" theme="bootstrap">\n          <ui-select-match placeholder="Pick a year">{{$select.selected.name}}</ui-select-match>\n          <ui-select-choices repeat="year.code as year in years | filter:$select.search">\n            {{year.name}}\n            <div ng-bind-html="year.name | highlight: $select.search"></div>\n          </ui-select-choices>\n        </ui-select>\n      </div>\n\n      <!-- type picker -->\n      <div class="col-sm-4">\n        <ui-select ng-model="editData.type" theme="bootstrap">\n          <ui-select-match placeholder="Pick a type">{{$select.selected.name}}</ui-select-match>\n          <ui-select-choices repeat="type.code as type in types | filter:$select.search">\n            {{type.name}}\n            <div ng-bind-html="type.name | highlight: $select.search"></div>\n          </ui-select-choices>\n        </ui-select>\n      </div>\n    </div>\n    <br>\n    <div class="row">\n      <!-- back button -->\n      <div class="col-sm-4">\n        <button type="button" class="btn btn-primary">Back</button>\n      </div>\n\n      <!-- class -->\n      <div class="col-sm-4">\n        <ui-select ng-model="editData.classId" theme="bootstrap">\n          <ui-select-match placeholder="Pick a class">{{$select.selected.title}}</ui-select-match>\n          <ui-select-choices repeat="class._id as class in allClasses | filter:$select.search">\n            {{class.title}}\n            <div ng-bind-html="class.title | highlight: $select.search"></div>\n          </ui-select-choices>\n        </ui-select>\n      </div>\n\n      <!-- next button -->\n      <div class="col-sm-4">\n        <button type="button" class="btn btn-primary" ng-click="submitEditedPaper( papersToEdit[0], editData )">Next</button>\n      </div>\n    </div>\n\n    <br>\n    <p>{{papersToEdit[0].title}}</p>\n    <canvas id="main-viewer"></canvas>\n\n  </div>\n  \n  <div class="col-sm-3">\n    <h4>Up Next:</h4>\n    <canvas id="next-up-pdf-container"></canvas>\n  </div>\n\n  <br><hr><br>\n\n  <div class="col-sm-12">\n    Files:\n    <ul>\n        <li ng-repeat="f in files" style="font:smaller">{{f.name}}</li>\n    </ul>\n    Upload Log:\n    <pre>{{log}}</pre>\n  </div>\n\n  <br><br>\n\n  <form ng-submit="addClass(newClass)">\n    <div class="col-sm-3">\n      <label for="newClass">New Class</label>\n      <input ng-model="newClass" type="text" class="form-control" placeholder="E.g. BIO180">\n      <button class="btn btn-primary">Add Class</button>\n    </div>\n  </form>\n\n  <!-- <button ng-click="addTokens()" class="btn btn-primary">Add tokens</button> -->\n      \n</div>')}])}(),function(e){try{e=angular.module("templates-app")}catch(n){e=angular.module("templates-app",[])}e.run(["$templateCache",function(e){e.put("landing/landing.tpl.html",'<div class="landing-page">  \n  <div class="col-md-6">\n    <form role="form" ng-submit="login(loginCredentials)">\n      <h2>Sign In</h2>\n      <hr class="colorgraph">\n\n      <div class="form-group">\n        <input ng-model="loginCredentials.email" type="text" name="email" class="form-control input-lg" placeholder="Email" tabindex="1">\n      </div>\n\n      <div class="form-group">\n        <input ng-model="loginCredentials.password" type="password" name="password" class="form-control input-lg" placeholder="Password" tabindex="2">\n      </div>\n\n      <!-- <hr class="colorgraph"> -->\n      <div class="row">\n        <div class="col-xs-12 col-md-12">\n          <input type="submit" value="Sign In" class="btn btn-primary btn-block btn-lg" tabindex="3">\n        </div>\n\n        <div class="col-sm-12 error-message">\n          <div class="alert alert-danger" role="alert" collapse="!loginError">\n            <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>\n            <span class="sr-only">Error:</span>\n            {{ loginError }}\n          </div>\n        </div>\n      </div>\n\n    </form>\n  </div>\n\n  <div class="col-md-6">\n    <form role="form" ng-submit="register(registerCredentials)">\n      <h2>Register</h2>\n      <hr class="colorgraph">\n\n      <div class="row">\n        <div class="col-xs-12 col-sm-12 col-md-12">\n          <div class="form-group">\n            <input ng-model="registerCredentials.name" type="text" name="name" id="name" class="form-control input-lg" placeholder="Name" tabindex="4">\n          </div>\n        </div>\n      </div>\n\n      <div class="form-group">\n        <input ng-model="registerCredentials.phone" type="text" name="phone" id="phone" class="form-control input-lg" placeholder="Phone (optional)" tabindex="5">\n      </div>\n\n      <div class="form-group">\n        <input ng-model="registerCredentials.email" type="email" name="email" id="email" class="form-control input-lg" placeholder="Email Address" tabindex="6">\n      </div>\n\n      <div class="row">\n        <div class="col-xs-12 col-sm-6 col-md-6">\n          <div class="form-group">\n            <input ng-model="registerCredentials.password" type="password" name="password" id="password" class="form-control input-lg" placeholder="Password" tabindex="7">\n          </div>\n        </div>\n\n        <div class="col-xs-12 col-sm-6 col-md-6">\n          <div class="form-group">\n            <input ng-model="registerCredentials.passwordConfirm" type="password" name="passwordConfirm" id="passwordConfirm" class="form-control input-lg" placeholder="Confirm Password" tabindex="8">\n          </div>\n        </div>\n      </div>\n\n\n      <div class="form-group">\n        <input ng-model="registerCredentials.addCode" type="addCode" name="addCode" id="add-code" class="form-control input-lg" placeholder="Add Code (it\'s case sensitive)" tabindex="9">\n      </div>\n\n\n      <div class="row">\n        <div class="col-xs-12 col-sm-12 col-md-12">\n           By clicking <strong class="label label-primary">Register</strong>, you agree to the <a href="#" data-toggle="modal" data-target="#t_and_c_m">Terms and Conditions</a> set out by this site, including our Cookie Use.\n        </div>\n      </div>\n\n\n      <div class="row">\n\n        <div class="col-xs-12 col-md-12">\n          <input type="submit" value="Register" class="btn btn-primary btn-block btn-lg" tabindex="10">\n        </div>\n\n        <div class="col-sm-12 error-message">\n          <div class="alert alert-danger" role="alert" collapse="!registrationError">\n            <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>\n            <span class="sr-only">Error:</span>\n            {{ registrationError }}\n          </div>\n        </div>\n\n      </div>\n\n\n    </form>\n  </div>\n</div>')}])}(),function(e){try{e=angular.module("templates-app")}catch(n){e=angular.module("templates-app",[])}e.run(["$templateCache",function(e){e.put("search/search.tpl.html",'<div class="search-page">\n  <div class="row well" id="search-bar">\n\n    <!-- search panel class search -->\n    <div class="col-sm-4" id="class-search">\n      <div class="col-sm-12">\n        <h1 class="text-left">Find Papers</h1>\n      </div>\n\n      <div class="col-sm-12">\n        <ui-select ng-model="query.classId" theme="bootstrap">\n          <ui-select-match placeholder="Pick a class">{{$select.selected.title}}</ui-select-match>\n          <ui-select-choices repeat="class._id as class in allClasses | filter:$select.search">\n            {{class.title}}\n            <div ng-bind-html="class.title | highlight: $select.search"></div>\n          </ui-select-choices>\n        </ui-select>\n      </div>  \n\n      <div class="col-sm-12">\n        <button id="find-papers-btn" class="btn btn-lg btn-block btn-primary" ng-click="findPapersByClass( query )">Get \'em</button>\n      </div>\n    </div> <!-- end search panel class search -->\n\n    \n    <!-- filters -->\n    <div class="col-sm-8">\n      <!-- <div class="col-sm-4">\n        <h4>\n          Sort By Quarter\n        </h4>\n\n        <div class="btn-group-vertical" role="group">\n          <button ng-click="togglePeriodReverse()" type="button" class="btn btn-default">Reverse Order</button>\n        </div>\n      </div> -->\n\n      <!-- <div class="col-sm-5">\n        <h4>\n          Filter by Type:\n        </h4>\n\n        <div class="btn-group-vertical" data-toggle="buttons">\n          <label class="btn btn-default">\n            <input type="checkbox" autocomplete="off" checked>Finals\n          </label>\n          <label class="btn btn-default">\n            <input type="checkbox" autocomplete="off">Midterms\n          </label>\n          <label class="btn btn-default">\n            <input type="checkbox" autocomplete="off">Quizzes\n          </label>\n        </div>\n\n        <div class="btn-group-vertical" data-toggle="buttons">\n          <label class="btn btn-default">\n            <input type="checkbox" autocomplete="off">Homework\n          </label>\n          <label class="btn btn-default">\n            <input type="checkbox" autocomplete="off">Notes\n          </label>\n          <label class="btn btn-default">\n            <input type="checkbox" autocomplete="off">Labs\n          </label>\n        </div>\n\n      </div> -->\n    </div>\n\n  </div>\n\n  \n  <div cg-busy="{ promise:busyFindingPapers, message: \'Finding Papers...\' }"></div>\n  <div cg-busy="{ promise:busyFindingPaperImage, message: \'Finding Papers...\' }"></div>\n\n  <br>\n\n  <table st-table="displayPapers" st-safe-src="papers" class="table table-striped">\n    <thead>\n      <tr>\n        <th>\n          <span ng-click="predicate = \'title\'; reverse = !reverse;" class="sort-header">\n            Title\n            <span ng-show="(predicate === \'title\' && reverse)" class="glyphicon glyphicon-chevron-down"></span>\n            <span ng-show="(predicate === \'title\' && !reverse)" class="glyphicon glyphicon-chevron-up"></span>\n            <span ng-show="predicate !== \'title\'" class="glyphicon glyphicon-chevron-up glyphicon-placeholder"></span>\n          </span>\n        </th>\n        <th>\n          <span ng-click="predicate = \'period\'; reverse = !reverse;" class="sort-header">\n            Quarter\n            <span ng-show="(predicate === \'period\' && reverse)" class="glyphicon glyphicon-chevron-down"></span>\n            <span ng-show="(predicate === \'period\' && !reverse)" class="glyphicon glyphicon-chevron-up"></span>\n            <span ng-show="predicate !== \'period\'" class="glyphicon glyphicon-chevron-up glyphicon-placeholder"></span>\n          </span>\n        </th>\n        <th>\n          <span ng-click="predicate = \'type\'; reverse = !reverse;" class="sort-header">\n            Type\n            <span ng-show="(predicate === \'type\' && reverse)" class="glyphicon glyphicon-chevron-down"></span>\n            <span ng-show="(predicate === \'type\' && !reverse)" class="glyphicon glyphicon-chevron-up"></span>\n            <span ng-show="predicate !== \'type\'" class="glyphicon glyphicon-chevron-up glyphicon-placeholder"></span>\n          </span>\n        </th>\n      </tr>\n      <tr>\n        <th colspan="5"><input st-search="" class="form-control" placeholder="Global Search..." type="text"></th>\n      </tr>\n    </thead>\n\n    <tbody>\n      <tr ng-repeat="paper in displayPapers | orderBy:predicate:reverse">\n        <td><a href="" ng-click="findImage( paper._id )" show-pdf-modal>{{ paper.title }}</a></td>\n        <td>{{ paper.period | periodFilter }}</td>\n        <td>{{ paper.type | typeFilter }}</td>\n      </tr>\n    </tbody>\n  </table>\n\n  </div>\n</div>\n')}])}();