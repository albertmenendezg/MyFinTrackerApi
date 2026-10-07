Feature: User registration

  Scenario: Registering a new user succeeds
    Given no user with email "john@doe.xyz" exists
    When I POST /auth/register with email "john@doe.xyz" and password "S3cur3Pass!"
    Then the response status is 201
    And the user with email "john@doe.xyz" is persisted
    And the credentials for email "john@doe.xyz" are persisted

  Scenario: Registering a duplicate email is rejected
    Given a user with email "john@doe.xyz" already exists
    When I POST /auth/register with email "john@doe.xyz" and password "S3cur3Pass!"
    Then the response status is 409
    And the error message says "already exists"

  Scenario: Registering with an invalid email is rejected
    Given no user with email "a@b" exists
    When I POST /auth/register with email "a@b" and password "S3cur3Pass!"
    Then the response status is 400
    And the error message says "email must be an email"

  Scenario: Registering with a weak password is rejected
    Given no user with email "john@doe.xyz" exists
    When I POST /auth/register with email "john@doe.xyz" and password "1234"
    Then the response status is 400
    And the error message says "password must be longer than or equal to 8 characters"

  Scenario: Rejecting a payload with unknown properties
    Given no user with email "john@doe.xyz" exists
    When I POST /auth/register with email "john@doe.xyz" and password "S3cur3Pass!" and unknown property "admin" = "true"
    Then the response status is 400
    And the error message says "property admin should not exist"