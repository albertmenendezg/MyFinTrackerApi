Feature: User roles

  Scenario: An admin grants admin to another user and the credential projection follows
    Given an admin user "root@doe.xyz" exists
    And a registered user "john@doe.xyz" with password "S3cur3Pass!"
    And I am logged in as "root@doe.xyz"
    When I PATCH the roles of "john@doe.xyz" with "admin"
    Then the response status is 204
    And the user "john@doe.xyz" has roles "admin"
    And the credential projection for "john@doe.xyz" has roles "admin"

  Scenario: A non-admin cannot update roles
    Given a registered user "john@doe.xyz" with password "S3cur3Pass!"
    And a registered user "jane@doe.xyz" with password "S3cur3Pass!"
    And I am logged in as "john@doe.xyz"
    When I PATCH the roles of "jane@doe.xyz" with "admin"
    Then the response status is 403

  Scenario: Updating roles of an unknown user is rejected
    Given an admin user "root@doe.xyz" exists
    And I am logged in as "root@doe.xyz"
    When I PATCH the roles of "ghost@doe.xyz" with "admin"
    Then the response status is 404

  Scenario: Updating roles with an invalid role is rejected
    Given an admin user "root@doe.xyz" exists
    And a registered user "john@doe.xyz" with password "S3cur3Pass!"
    And I am logged in as "root@doe.xyz"
    When I PATCH the roles of "john@doe.xyz" with "superuser"
    Then the response status is 400
