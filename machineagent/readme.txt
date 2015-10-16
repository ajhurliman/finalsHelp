****************************************************************************

   Please consult the the documentation online for up-to-date information

       https://docs.appdynamics.com/display/PRO4152/Server+Monitoring

****************************************************************************

Machine Agent Installation
--------------------------

A machine needs one active machine agent installation per application. Make sure you don't
have any previous running installation processes before you install.

1. Edit the controller-info.xml file to point to installed controller host and controller port.

Go to <agent_install_dir>/conf/controller-info.xml and change the following tags:

        <controller-host></controller-host>
        <controller-port></controller-port>

If HTTPS is enabled between the agent and the controller, set the following parameter to true:

        <controller-ssl-enabled>true</controller-ssl-enabled>

If the machine agent is connecting to a multi-tenant controller or the AppDynamics SaaS controller 
set the account name (This value is optional on-premise):
 
        <account-name></account-name>

Set the account access key to the one provided by the controller (please consult online documentation
to find the key if needed):

        <account-access-key></account-access-key>

If the machine agent is being installed on a machine which does not have the app server agent, 
or the machine agent will be installed BEFORE the app server agent, these tags may be added:

        <!-- the name of the application this machine belongs to -->
        <application-name></application-name>

        <!-- the tier this machine is associated with -->
        <tier-name></tier-name>

        <!-- the node name assigned to this machine -->
        <node-name></node-name>
 
This information can also be specified using environment variables or system properties. Please
see the online documentation for details.

2. Depending on the downloaded package, the machine agent may or may not ship with a JRE (you can check
   if you have a "jre" directory under the machine agent directory). The machine agent uses JRE version 1.7
   and above.

The following command will start it on POSIX systems:

        bin/machine-agent

or on Windows:

        bin\machine-agent.cmd


The bin directory would be in the directory where you extracted the machine agent.

Consult the online documentation for installing the machine agent as a service.

3. Verify that the agent has been installed correctly.

Check that you have received the following message that the java agent was started successfully in the agent.log file in your <agent_install_dir>/logs/agent.log folder.
This message is also printed on the stdout of the process.

Started APPDYNAMICS Machine Agent Successfully.


4. If you are installing the machine agent on a machine which has a running app server agent, the hardware data is automatically assigned to the app server node/s running
   on the machine.


5. If you are installing the machine agent on a machine which does not have a running app server agent i.e. on a database server/ Message server, or if you did not 
   specify the Application Name and Tier Name explicitly in Step 1

   a) you will have to register the machine agent and associate it with an application.
   b) once the relevant database server/message server is discovered in a business transaction, click on the display name link and then on 'Resolve' to associate
      the hardware data to the right tier.


Connecting to the Controller through a Proxy Server
--------------------------------------------------

Use the following system properties to set the host and port of the proxy server so that it can route requests to the controller.

        com.singularity.httpclientwrapper.proxyHost=<host>
        com.singularity.httpclientwrapper.proxyPort=<port>


Specifying custom host name
---------------------------

The host name for the machine on which the Agent is running is used as an identifying property for the Agent Node. 
If the machine host name is not constant or if you prefer to use a specific name of your choice, please specify the 
following system property as part of your startup command.

        -Dappdynamics.agent.uniqueHostId=<host-name>


Troubleshooting
---------------

- Machine metrics are not showing up for my application

The unique host ID used by App Agents must match the host ID used by the machine agent. When in
doubt, set both to a custom value. Additionally, a limitation in the machine agent requires
each application to have its own instance of the machine agent. This limitation will soon be
removed.

- I'm have trouble starting the machine agent

Please check the logs in the log directory for information that can help. Are you using the
bundled JRE? If not, is the JRE version you are using 1.7 or above? You can check by
executing "java -version".

- I am still having issues

More issues are discussed online here:

        https://docs.appdynamics.com/display/PRO4152/Standalone+Machine+Agent+FAQ

Please contact technical support for assistance.
