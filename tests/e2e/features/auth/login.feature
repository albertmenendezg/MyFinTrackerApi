Feature: User login

  Background:
    Given a registered user "john@doe.xyz" with password "S3cur3Pass!"

  Scenario: Logging in with valid credentials succeeds
    When I POST /auth/login with email "john@doe.xyz" and password "S3cur3Pass!"
    Then the response status is 204
    And the response body is empty
    And the response sets the "access_token" cookie
    And the response sets the "refresh_token" cookie
    And a refresh token is stored for "john@doe.xyz"
    And no raw refresh token is stored

  Scenario: Logging in with a wrong password is rejected
    When I POST /auth/login with email "john@doe.xyz" and password "Wr0ngPass!"
    Then the response status is 401
    And the response sets no cookie
    And no refresh token is stored for "john@doe.xyz"

  Scenario: Logging in with an unknown email is rejected
    When I POST /auth/login with email "nobody@doe.xyz" and password "S3cur3Pass!"
    Then the response status is 401
    And no refresh token is stored for "nobody@doe.xyz"

  Scenario: The access cookie identifies the user
    Given I am logged in as "john@doe.xyz"
    When I GET /auth/me
    Then the response status is 200
    And the response body field "email" is "john@doe.xyz"

  Scenario: A protected route rejects an anonymous request
    When I GET /auth/me
    Then the response status is 401

  Scenario: A protected route rejects a forged access token
    Given I hold an invalid access cookie
    When I GET /auth/me
    Then the response status is 401

  Scenario: Registration stays reachable without authentication
    When I POST /auth/register with email "jane@doe.xyz" and password "S3cur3Pass!"
    Then the response status is 201
    And the user with email "jane@doe.xyz" is persisted
