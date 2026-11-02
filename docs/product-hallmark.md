# Product screens

## Sign-in

Hallmark, before:

- The development accounts sit in a dashed box, which reads as a scaffold.
- The Microsoft area names the Entra application id, secret, and tenant issuer.
- The introduction ends with “You will not see code.”
- The actions are three stacked rectangles with the same weight as the explanation.

Humanizer:

- The introduction now says what the editor is for: pages, pictures, and navigation on a website the person already works on.
- When Microsoft is not configured, the screen says “Sign-in is unavailable.” It does not name environment variables.
- The heading is “Website editor.”

After:

- The unavailable state, or Microsoft when it is configured, is the primary block.
- Development accounts use the quiet product button and a top rule. There is no dashed border.
- Focus uses the shared product ring.
- Checked at 1440, 768, and 390. The page does not scroll sideways.

18.1 has no standalone page. These components are first used here.

There is no separate callback URL. While a sign-in request is in flight, the button label is “Signing you in” and the button will not submit again. That state does not show an error.

A failed sign-in returns to this page and says “Sign-in did not complete. Try again.” The raw error code is not shown. A later successful sign-in leaves the page, so the sentence is gone.

Development accounts sit under “Development access,” with one line that they exist only on a local copy. The group is quieter than the unavailable card. It is omitted when development auth is off. The administrator still opens Connect a website. The client editor still does not.
