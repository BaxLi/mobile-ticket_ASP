
<h1>Release notes Mobile Ticket 2</h1>

----------

<h2>Introduction</h2>

This document describes the new features, bug corrections, known issues and recommendations for Mobile Ticket 2. If you want to know about connector changes details or similar, this document is for you.

**Note:** Several of the remarks refer to a Jira number (Jira is Qmatic&#39;s internal registration system for bugs), or Pivotal Tracker (internal system for improvements and other issues).

<!--Add new update section after each release

<h2>Version UPDATE_VERSION_NUMBER</h2>

**Date:**
 
**Build number:**

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **xxx** | **Story header** Solution text |

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **xxx** | **Bug header** Solution text |

<h3>Known issues</h3>

| **Id/Jira** | **Description** |
| --- | --- |
| **xxx** | **Bug header** Bug text |

<h3>Upgrade instructions</h3> 

----------
-->

<h2> Version 2.5.2 </h2>

**Date: 2023-01-20**
 
**Build number: 1**

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-980** | **Calculation of appoinment time results in a wrong result between timezones.** |
| **MOB-976** | **Minior ui issue fixed.** |


----------


<h2> Version 2.5.1 </h2>

**Date: 2023-01-12**
 
**Build number: 1**

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-977** | **Set first name and last name as mandatory fields** |


----------

<h2> Version 2.5.0 </h2>

**Date: 2023-01-04**
 
**Build number: 5**

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-958** | **Enter First & Last Name in Mobile Ticket** |

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-950** | **Description cipher usage in proxy-config is not correct** |
| **MOB-937** | **CSS issue - Incorrect footer text color** |
| **MOB-962** | **Mobile Ticket - Hide Some Components** |

----------

<h2> Version 2.4.0 </h2>

**Date: 2022-10-12**
 
**Build number: 4**

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-910** | **Make it posible to add a image header** |
| **MOB-912** | **Update Mobile Ticket deployment guide with delay visit** |
| **MOB-922** | **Update jQuery library into the latest version** |
| **MOB-935** | **Additional Customer Information URL feature does not work on certain preselect functions** |

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-921** | **Mobile Ticket does not work well on iPhone SE** |

----------

<h2> Version 2.3.0 </h2>

**Date: 2022-08-19**
 
**Build number: 6**

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-876** | **MT, "wrong" language sentence in Swedish** |
| **MOB-879** | **Default language change when leaving the line** |
| **MOB-900** | **Include all supported languages in locale in release** |

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-874** | **error in a node module - TypeError: Cannot read property 'notes' of undefined** |
| **MOB-896** | **Proxy request path issue for translate service** |
| **MOB-897** | **Appointment arrive functionality for QCA + Visit Manager** |

----------

<h2> Version 2.2.0 </h2>

**Date: 2022-07-04**
 
**Build number: 1**

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-881** | **New Mobile Ticket Version 2.0.0 Incompatible with Linux** |

----------

<h2> Version 2.1.0 </h2>

**Date: 2022-06-17**
 
**Build number: 6**

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-813** | **Upgrade node modules** |
| **MOB-860** | **Insecure content security policy** |
| **MOB-861** | **Server fingerprinting** |
| **MOB-857** | **Permissive cross origin resource sharing** |

----------

<h2> Version 2.0.0 </h2>

**Date: 2022-06-10**
 
**Build number: 11**

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-767** | **Rebranding mobile Ticket.** |
| **MOB-793** | **Include new development guide into the build package.** |
| **MOB-777** | **Remove encoding/decoding from Mobile Ticket.** |
| **MOB-819** | **Sibelco - Mobile ticket url with servicegroup and customerid(license plate) and orderid(see sammeleinkauf) in url** |
| **MOB-812** | **Investigation on nssm.exe** |
| **MOB-783** | **Mobile Ticket, not show branches with blocked geolocation** |
| **MOB-836** | **More flexibility on custom branding** |
| **MOB-849** | **Use Procrun for create windows service** |
| **MOB-823** | **Service group custom branding and few more changes from UX** |
| **MOB-867** | **Include the new deployment guide in the MT project** |
| **MOB-838** | **Loading UI for "Leave the line" in Mobile Ticket** |
| **MOB-787** | **Show translated servicename** |

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-809** | **UI issue in OTP screen** |
| **MOB-820** | **Some properties (keys in config, logo.. etc) are not correctly updated with upgrade script** |
| **MOB-822** | **Mobile Ticket - Service groups show up for each branch even when empty for branch** |
| **MOB-804** | **Apply encoded related changes into the core version.** |
| **MOB-851** | **Not validate same ticket correctly** |
| **MOB-850** | **Address other errors in visit cancel.** |
| **MOB-787** | **Show translated servicename** |

<h3>Upgrade Instructions</h3>

- When upgrading from a previous version, following should be considered.

1. 'service_translation' parameter needs to be added to config.json
```
"service_translation": {
    "value": "disable",
    "description": "Enable or disable service translation"
  }
```
2. When upgrading from a previous version, API Gateway route needs to be added to application.yml.

```
 translations:
        path: /MobileTicket/translations/*
        url: ${orchestra.central.url}/calendar-backend/api/v1
```
----------

<h2> Version 1.16.1 </h2>

**Date: 2022-03-07**
 
**Build number: 1**


<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-306** | **Revisit the Issue fixed in MOB-271 after updating the angular version** |
| **MOB-780** | **Reimplement the handling of 503 for the function pollVisitStatus** |

----------

<h2> Version 1.16.0 </h2>

**Date: 2022-01-28**
 
**Build number: 5**

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-752** | **L&T Osnabruck - Mobile ticket with QR code with sammelkauf id and possibility to ask customer number.** |
| **MOB-760** | **Show more text in service group name list items** |
| **MOB-762** | **Include digicertglobalroot2 certificate in mobile ticket package** |
| **MOB-765** | **Update 'README' with 'npm -i instructions'** |

<h3>Upgrade Instructions</h3>

- When upgrading from a previous version, following should be considered.

1. 'additional_data' parameter under 'customer_data' needs to be added to config.json
```
 "customer_data": {
    "value": {
      "phone_number": {
        "value": "disable",
        "description": "Enable or disable customer phone number field in customer data section, 'enable => phone number field is visible but not mandatory', 'disable => phone number field is not visible' , 'mandatory => phone number field is visible and mandatory'"
      },
      "customerId": {
        "value": "disable",
        "description": "Enable or disable customer id field in customer data section, 'on = enable', 'off = disable'"
      },
      "additional_data": {
        "value": "",
        "description": "Enable or disable additonal customer data on QR scanning URL, set a value that is using in query parameter"
      }
    },
    "description": "Enable or disable customer id or phone number in customer area. If both are disabled customer data section will be hidden"
  }
```
----------

<h2> Version 1.15.0</h2>

**Date: 2021-11-10**
 
**Build number: 5**

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-634** | **"Powered by Qmatic" in Mobile Ticket** |
| **MOB-642** | **Remote Queueing capability in Mobile Ticket** |
| **MOB-730** | **Mobile Ticket - Service Grouping** |
| **MOB-720** | **Security improvements related to appointment id** |

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-616** | **Prefilled mobile no in OTP screen get cleared if user open & close cookie consent popup** |
| **MOB-649** | **Text above ticket is not shown if the visit is called by a hardware device** |
| **MOB-648** | **Record all visits used Mobile Ticket application** |
| **MOB-668** | **windows server 2019 - Mobile Ticket cannot run as a service** |
| **MOB-661** | **Network error message doesn't appear if "show_queue_position" is disabled.** |
| **MOB-663** | **User can see queue position in the title tag, even if the "show_queue_position" is disabled.** |
| **MOB-704** | **Direct link to branch without locationservices shows different error.** |
| **MOB-705** | **Appointment Time - Text color should taken from theme-styles.css.** |
| **MOB-710** | **Cannot create mobileTicket from direct ticket url when both phn no & customer info are enabled** |
| **MOB-669** | **UI - Reduce the line height of button texts.** |

<h3>Upgrade Instructions</h3>

- When upgrading from a previous version, following should be considered.

1. 'footer' parameter needs to be added to config.json
```
 "footer": {
    "value": {
      "logo": {
        "value": "disable",
        "description": "show or hide the brand logo on the footer, enable = show, disable = hide"
      },
      "custom_text": {
        "value": "",
        "description": "show customize text on the footer, an empty value will hide the footer"
      }
    },
    "description": "Show or hide footer of the mobile ticket"
  }
```

2. 'delay_visit' parameter needs to be added to config.json
```
 "delay_visit": {
    "value": {
      "availability": {
        "value": "disable",
        "description": "Enable or disable whether customer need to create or update visit with delay"
      },
      "time_slot": {
        "value": [],
        "description": "Define delay time slots (minutes)"
      }
    },
    "description": "Enable or disable or define a time when customer need to create or update visit with delay"
  }
```

3. 'service_group' parameter needs to be added to config.json
```
 "service_group": {
    "value": {
      "availability": {
        "value": "enable",
        "description": "Enable or disable service grouping, 'on = enable', 'off = disable'"
      },
      "single_selection": {
        "value": "enable",
        "description": "Enable or disable single service grouping selection, 'on = enable', 'off = disable'"
      }
    },
    "description": "Enable or disable or define a single selection when services show as group"
  }
```
---------- 
<h2> Version 1.14.0</h2>

**Date: 2021-05-24**
 
**Build number: 6**

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-578** | **Update version value when doing an upgrade in mobile ticket** |
| **MOB-552** | **Improving Mobile Ticket phone number with country code/flag** |
| **MOB-576** | **Mobile ticket to arrive appointment based on external ID** |
| **MOB-586** | **Customer entry of phone number mandatory.** |
| **MOB-583** | **Ability to turn off place in line / queue.** |

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-607** | **User navigate back to customer data page from privacy policy active consent page, if cookie concern popup open for the second time** |
| **MOB-616** | **Prefilled mobile no in OTP screen get cleared if user open & close cookie consent popup** |

<h3>Upgrade Instructions</h3>

- When upgrading from a previous version, following should be considered.

1. 'preferred_country_list' parameter needs to be added to config.json
```
 "preferred_country_list": {
    "value": "",
    "description": "Define the preferred country codes for dropdown in country code inputs. list of comma separated country codes is expected. Should be 'ISO alpha-2 format'."
  }
```
2. 'show_appointment_time' parameter needs to be added to config.json
```
 "show_appointment_time": {
    "value": "disable",
    "description": "show appointment time in the ticket"
  }
```
3. 'show_queue_position' parameter needs to be added to config.json
```
 "show_queue_position": {
    "value": "enable",
    "description": "show queue and queue position in the ticket"
  }

```
4.  'customer_data' parameter description needs to be updated
```
  "customer_data": {
    "value": {
      "phone_number": {
        "value": "disable",
        "description": "Enable or disable customer phone number field in customer data section, 'enable => phone number field is visible but not mandatory', 'disable => phone number field is not visible' , 'mandatory => phone number field is visible and mandatory'"
      },
      "customerId": {
        "value": "disable",
        "description": "Enable or disable customer id field in customer data section, 'on = enable', 'off = disable'"
      }
    },
    "description": "Enable or disable customer id or phone number in customer area. If both are disabled customer data section will be hidden"
  },
```
5. When upgrading from a previous version, API Gateway route needs to be added to application.yml.

```
 central_appointment_ext_id:        
        path: /MobileTicket/MyAppointment/findCentral/external/*
        url: ${orchestra.central.url}/qsystem/rest/appointment/appointments/external
```
---------- 

<h2> Version 1.13.1 </h2>

**Date: 2021-04-15**
 
**Build number: 5**

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-575** | **Restrict REST methods exposed from mobile ticket.** |

----------

<h2>Version 1.13.0</h2>

**Date: 2021-04-09**
 
**Build number: 6**

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-309** | **Angular version updated to v11** |
| **MOB-526** | **Enter customer information in ticket** |
| **MOB-558** | **Geo-fencing Configurable*** |

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-557** | **Long service names are rendered incorrectly** |

<h3>Upgrade Instructions</h3>

- When upgrading from a previous version, 'customer_data' parameter needs to be added to config.json.

```
 "customer_data": {
    "value": {
      "phone_number": {
        "value": "disable",
        "description": "Enable or disable customer phone number field in customer data section, 'on = enable', 'off = disable'"
      },
      "customerId": {
        "value": "disable",
        "description": "Enable or disable customer id field in customer data section, 'on = enable', 'off = disable'"
      }
    },
    "description": "Enable or disable customer id or phone number in customer area. If both are disabled customer data section will be hidden"
  }
```

----------

<h2>Version 1.12.0</h2>

**Date: 2021-03-02**
 
**Build number: 6**

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-508** | **Prevent replay attacks in MT** |
| **MOB-504** | **improve upgrade procedure** |
| **MOB-426** | **Never show "Get New Ticket" button in the thankyou page when user open a ticket which is NOT created via MT** |
| **MOB-393** | **Mobile Ticket phone number** |

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-509** | **Date format issue when the year is set to YY** |
| **MOB-512** | **OTP validation for multiple resend attempts by replaying the request** |

<h3>Upgrade Instructions</h3>
- When upgrading from a previous version, following should be considered.

1. 'create_ticket_token' parameter needs to be added to config.json

```
"create_ticket_token": {
    "value": "enable",
    "description": "Enable or disable unique token for a ticket"
  }
```
"Create ticket token" feature needs a valid MongoDB database and the connection string needs to be provided for the "db_connection_string" parameter and "tenant_id" as mentioned in the previous upgrade. The database can setup as a local MongoDB database, a MongoDB hosted on a cloud like AWS (https://docs.aws.amazon.com/quickstart/latest/mongodb/welcome.html), a global cloud database service like Atlas (https://www.mongodb.com/cloud/atlas), or can be run as a docker container. Please read the deployment guide for more information regarding this.

----------

<h2> Version 1.11.1 </h2>

**Date: 2021-01-21**
 
**Build number: 5**

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **00000000** | **DMV view ticket URL leave the line not allowed to view anymore tickets because of the local storage visit validation fixed.** |

----------

<h2> Version 1.11.0 </h2>

**Date: 2020-12-18**
 
**Build number: 7**

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-434** | **Enforced geo-fence** |

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-457** | **It is still possible to get a ticket for a closed service when direct url to the service is used.** |
| **MOB-384** | **Nothing happens when user try to arrive an appointment while API_GW or Orchestra is down.** |
| **MOB-418** | **Thankyou page appear for short moment before user redirect to customer feedback page.** |
| **MOB-422** | **Loading icon hangs forever when there is no branch nearby.** |
| **MOB-432** | **Validate tenant_id.** |
| **MOB-415** | **OTP implementation : MongoDB - Show validation message for DB errors.** |
| **MOB-456** | **OPT functionality is not working for create visit url while customer_data is disabled.** |
| **MOB-421** | **Improve the description of "customer_feedback" setting.** |
| **MOB-428** | **Firefox only > horizontal scroll bars appear with form validation messages.** |
| **MOB-430** | **Send Information button is too low on the high resolution devices issue fixed.** |
| **MOB-471** | **Console errors fixed in branch loading.** |
| **MOB-425** | **Location Service robustness issue fixed.** |
| **MOB-494** | **Restrict passcode field to eight characters/digits.** |
| **MOB-492** | **Show a message if no service selected.** |
| **MOB-501** | **Not able to use link from create/call notification if all services are disabled.** |
| **MOB-498** | **Mobile Tickets can be created during branch closed time issue fixed.** |
| **MOB-496** | **OTP timer gets separated when having a long heading.** |
| **MOB-497** | **Set "Service screen timeout" to its default value.** |

----------

<h2>Version 1.10.0</h2>

**Date: 2020-10-29**
 
**Build number: 2**

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-312** | **Mobile Ticket works with button sheduler** |
| **MOB-300** | **Improved Installation Procedure** |
| **MOB-301** | **Improved Upgrade Procedure** |
| **MOB-311** | **Get New Ticket - OTP Implementation** |
| **MOB-385** | **Get New Ticket - Configurable unit of distance** |


<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-287** | **Possibility to change the HSTS time** |
| **MOB-286** | **Possibility to change the used ciphers** |
| **MOB-304** | **Allow to create a new ticket while viewing an existing ticket** |
| **MOB-305** | **Random issue in parallel ticket scenario > visit doesn't end in one tab** |
| **MOB-307** | **Firefox and Edge support should be provide in iOS** |
| **MOB-299** | **Very intense polling for mobile ticket status bug fixed** |
| **MOB-350** | **Allow to arrive an appointment visit while already open a ticket** |
| **MOB-352** | **Allow to view/create a visit while open an appointment ticket from another tab** |
| **MOB-355** | **iPhone input fields > zoom in persist after focus out from input fields** |
| **MOB-351** | **Allow to view a ticket while already open a ticket from another tab** |
| **MOB-353** | **RTL issue in Mobile ticket** |
| **MOB-387** | **Cookie consent popup shouldn't appear in some pages bug fixed** |
| **MOB-382** | **Ding sound and ticket flash is only working for the first time** |

<h3>Upgrade Instructions</h3>
- When upgrading from a previous version, following should be considered.

1. 'otp_service' parameter needs to be added to config.json

```
"otp_service": {
    "value": "enable",
    "description": "Enable or disable OTP service"
  }
```
2. 'tenand_id' parameter needs to be configured in mt-service/src/config/config.json
```
  "tenant_id": {
    "value": "1001",
    "description": "unique identifire of the client application"
  }
```
3. 'db_connection_string' parameter needs to be configured in mt-service/src/config/config.json
```
  "db_connection_string": {
    "value": "",
    "description": "database connection URL"
  }
```
OTP feature needs a valid MongoDB database and the connection string needs to be provided for the "db_connection_string" parameter as mentioned above. The database can setup as a local MongoDB database, a MongoDB hosted on a cloud like AWS (https://docs.aws.amazon.com/quickstart/latest/mongodb/welcome.html), a global cloud database service like Atlas (https://www.mongodb.com/cloud/atlas), or can be run as a docker container. Please read the deployment guide for more information regarding this.

----------

<h2>Version 1.9.1</h2>

**Date: 2020-09-14**
 
**Build number: 1**

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-310** | **Preselected country code doesn't show when using link directly to service** |

----------

<h2>Version 1.9.0</h2>

**Date:2020-09-11**
 
**Build number:1**

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-272** | **Open MT from same device as created only** |

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-271** | **"Get new ticket" not functioning** |

<h3>Upgrade Instructions</h3>
- When upgrading from a previous version, 'block_other_browsers' parameter needs to be added to config.json.

```
"block_other_browsers" : {
        "value": "disable",
        "description": "Enable or disable whether user allow to use/open the ticket in other devices ..."
    }
```

----------

<h2>Version 28</h2>

**Date:2020-09-08**
 
**Build number:28**

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-302** | **customer data related bug fix** |

----------

<h2>Version 27</h2>

**Date:2020-08-28**
 
**Build number:27**

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-251** | **No error displayed when user try to arrive an already arrived visit** |

----------

<h2>Version 26</h2>

**Date:2020-08-17**
 
**Build number:26**

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-225** | **MT compatibility issues when test in Firefox** |
| **MOB-226** | **MT compatibility issues when test in Edge browser** |
| **MOB-202** | **MT Application operate as a service** |
| **MOB-151** | **MobileTicket Block in Windows+Safari** |

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-219** | **Appointment time display bug** |
| **MOB-230** | **Set curser to pointer in service list** |

----------

<h2>Version 25</h2>

**Date:2020-07-17**
 
**Build number:25**

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-221** | **Handle API GW newly defined 404 error with message** |
| **MOB-220** | **Loading text on ticket page function implement** |
| **MOB-208** | **Cookie clean up and convert cookie usage to use local storage** |
| **MOB-195** | **Active Cookie consent implemented** |
| **MOB-186** | **Possibility to change the TLS version in the proxy-config.json** |

----------

<h2>Version 24</h2>

**Date:2020-07-17**
 
**Build number:24**

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-158** | **Integration with MsTeams for Remote Serving customers in Core** |
| **MOB-175** | **Improve UI, enter of mobile number more intuitive** |
| **MOB-177** | **Introduce extra configurable color to be used for privacy policy link** |

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-155** | **Mobile Ticket Add Phone Number** |

----------

<h2>Version 23</h2>

**Date:2020-07-01**
 
**Build number:23**

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-174** | **Give more attraction to phone number text and button** |

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-159** | **Notes are gone when checkin appointment** |

----------

<h2>Version 22</h2>

**Date:2020-05-18**
 
**Build number:22**

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-138** | **End user flow, enter mobile number feature** |

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-146** | **If branch is closed for the whole day the Opening hours are shown as "false" bug fixed** |

<h3>Upgrade instructions</h3> 

- New customer data (mobile number) entry feature requires notification module version 4.0.0.49 or above.

----------

<h2>Version 21</h2>

**Date:2020-05-18**
 
**Build number:21**

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **MOB-137** | **New feature to load appointments through a URL and arrive** |

<h3>Upgrade instructions</h3> 

- New configurations related to appointment arrival needs to be entered in src/config/config.json. You can find the new entries in README.md.
- When configuring "Appointment Confirmation" notification type, below message format should be used.
  ```html
  http://[MOBILE_TICKET_SERVER]/appointment?appId=[publicId]
  ```

----------

<h2>Version 20</h2>

**Date:2020-04-20**
 
**Build number:20** 

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **GP-2624** | **Agent name to be shown when called is now optional** Done from en.json. For example {firstName} is ready to serve you at |

----------

<h2>Version 19</h2>

**Date:2020-01-27**
 
**Build number:19** 

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **169836431** | **Vulnerability: Click jacking - enable/disable MT in iframe** Increase security level in the application using security headers |

----------

<h2>Original release</h2>

**Date:2019-10-11**
 
**Build number:18** 

<h3>Stories</h3>

| **Id** | **Release notes** |
| --- | --- |
| **xxx** | **Story header** Story text |

<h3>Bug fixes</h3>

| **Id** | **Release notes** |
| --- | --- |
| **xxx** | **Bug header** Solution text |

<h3>Known issues</h3>

| **Id/Jira** | **Description** |
| --- | --- |
| **xxx** | **Bug header** Bug text |

<h3>Upgrade Instructions</h3>

----------

<h3>Copyright notice</h3>

The information in this document is subject to change without prior notice and does not represent a commitment on the part of Q-MATIC AB. All efforts have been made to ensure the accuracy of this manual, but Q-MATIC AB cannot assume any responsibility for any errors and their consequences.

This manual is copyrighted and all rights are reserved.
Qmatic and Qmatic Orchestra are registered trademarks or trademarks of Q-MATIC AB.
Reproduction of any part of this manual, in any form, is not allowed, unless written permission is given by Q‑MATIC AB.
COPYRIGHT &copy; Q-MATIC AB, 2020.
