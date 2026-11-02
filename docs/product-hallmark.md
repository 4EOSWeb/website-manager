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

## Website list

Hallmark, before:

- The screen is centered like a gate, with a large empty field above two rows.
- The kicker says “Your websites” and the heading says “Choose a website,” so the heading tells the person what to do instead of naming the list.
- Each site is a full-width text link. The host sits on the same line, and there is no separate edit action.
- An administrator has no connect action on this screen.

Humanizer:

- The heading is “Your websites.” The period from the plan sentence is left off because this is a heading, not a sentence.
- “Choose a website” is gone. It repeated the kicker and instructed the reader.
- The action on a card is “Edit.” “Connect a website” stays, because that is the action and the words the rest of the product already uses.

After:

- The list starts at the top. Each site is a card with the name, the host, and Edit.
- Administrators get Connect a website. A client editor does not, and still only sees Quantum Age.
- Harbor & Co. opens the Harbor editor. Quantum Age opens the Quantum Age editor.
- Checked at 1440, 768, and 390. The page does not scroll sideways.
- Tab reaches Connect a website with the product focus ring.
- This route has no loading file and no error file. A signed-out visit goes to sign-in. Loading and error screens are later steps.

## Empty website list

There was no empty screen before this. A person with no sites saw the heading and a blank list.

The empty state is a card with a small page mark and one sentence. An administrator sees “Nothing is connected yet.” and Connect a website. A client editor sees “No website is assigned to you.” and no connect action. A person who already has sites still sees the cards. The mark does not move, so reduced motion has nothing extra to stop. Keyboard focus lands on Connect a website in the administrator empty state. There is still no loading or error file on this route.
