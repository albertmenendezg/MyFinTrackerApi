Feature: User profile

  Scenario: Getting my profile returns what register created
    Given a registered user "john@doe.xyz" with password "S3cur3Pass!"
    And I am logged in as "john@doe.xyz"
    When I GET /users/me
    Then the response status is 200
    And the response body field "email" is "john@doe.xyz"
    And the response body field "name" is "John Doe"
    And the response body field "preferredCurrency" is "EUR"

  Scenario: Getting my profile without cookies is rejected
    Given I have no cookies
    When I GET /users/me
    Then the response status is 401

  Scenario: Updating my name and currency
    Given a registered user "john@doe.xyz" with password "S3cur3Pass!"
    And I am logged in as "john@doe.xyz"
    When I PATCH /users/me with name "Jane Doe" and currency "USD"
    Then the response status is 204
    When I GET /users/me
    Then the response status is 200
    And the response body field "name" is "Jane Doe"
    And the response body field "preferredCurrency" is "USD"

  Scenario: Updating my address and avatar
    Given a registered user "john@doe.xyz" with password "S3cur3Pass!"
    And I am logged in as "john@doe.xyz"
    When I PATCH /users/me with address "Calle Mayor 1", "Madrid", "28001", "ES"
    Then the response status is 204
    When I PATCH /users/me with avatar "https://example.com/jane.png"
    Then the response status is 204
    When I GET /users/me
    Then the response status is 200
    And the response address field "street" is "Calle Mayor 1"
    And the response address field "city" is "Madrid"
    And the response body field "avatar" is "https://example.com/jane.png"

  Scenario: Clearing my avatar
    Given a registered user "john@doe.xyz" with password "S3cur3Pass!"
    And I am logged in as "john@doe.xyz"
    When I PATCH /users/me with avatar "https://example.com/john.png"
    Then the response status is 204
    When I PATCH /users/me clearing the avatar
    Then the response status is 204
    When I GET /users/me
    Then the response status is 200
    And the response body field "avatar" is null

  Scenario: Updating with an unknown currency is rejected
    Given a registered user "john@doe.xyz" with password "S3cur3Pass!"
    And I am logged in as "john@doe.xyz"
    When I PATCH /users/me with currency "XXX"
    Then the response status is 400

  Scenario: Rejecting a profile payload with unknown properties
    Given a registered user "john@doe.xyz" with password "S3cur3Pass!"
    And I am logged in as "john@doe.xyz"
    When I PATCH /users/me with unknown property "admin" = "true"
    Then the response status is 400
    And the error message says "property admin should not exist"
