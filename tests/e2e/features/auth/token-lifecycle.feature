Feature: Token rotation and logout

  Background:
    Given a registered user "john@doe.xyz" with password "S3cur3Pass!"
    And I am logged in as "john@doe.xyz"

  Scenario: Refreshing rotates both cookies
    Given I keep the current refresh cookie
    When I POST /auth/refresh
    Then the response status is 204
    And the response body is empty
    And the response sets the "access_token" cookie
    And the response sets the "refresh_token" cookie
    And the kept refresh token is revoked
    And an active refresh token is stored for "john@doe.xyz"

  Scenario: A rotated refresh token cannot be replayed
    Given I keep the current refresh cookie
    And I POST /auth/refresh
    And I send the kept refresh cookie
    When I POST /auth/refresh
    Then the response status is 401
    And the error message says "revoked"

  Scenario: Refreshing without a refresh cookie is rejected
    Given I have no cookies
    When I POST /auth/refresh
    Then the response status is 401
    And the error message says "refresh"

  Scenario: Refreshing with a forged refresh cookie is rejected
    Given I hold a forged refresh cookie
    When I POST /auth/refresh
    Then the response status is 401

  Scenario: Logging out revokes the refresh token and clears the cookies
    Given I keep the current refresh cookie
    When I POST /auth/logout
    Then the response status is 204
    And the response clears the "access_token" cookie
    And the response clears the "refresh_token" cookie
    And the kept refresh token is revoked

  Scenario: A logged out refresh token cannot be reused
    Given I keep the current refresh cookie
    And I POST /auth/logout
    And I send the kept refresh cookie
    When I POST /auth/refresh
    Then the response status is 401

  Scenario: Logging out without any cookie still succeeds
    Given I have no cookies
    When I POST /auth/logout
    Then the response status is 204
