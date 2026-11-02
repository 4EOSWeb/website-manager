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

## Site dashboard

Hallmark, before:

- `/sites/web_harbor` and `/sites/web_quantum_age` had no page. Both showed “That page is not available.”
- The only site home was the editor canvas.

Humanizer:

- The heading is the site name.
- Edit, Pages, Media, and Review are the action names. The line under each one says what it opens.
- “Your websites” is the way back to the list.

After:

- Harbor shows Edit, Pages, and Media. It does not show Review, because that site does not support review publishing.
- Quantum Age shows Review as well.
- Each card opens `/sites/<id>/editor`, which is where those tools live. The editor still shows the Pages heading.
- Checked at 1440, 768, and 390. The page does not scroll sideways.
- Tab reaches “Your websites,” and the focus ring is visible.
- Someone without access still gets “That page is not available.” This route has no loading file.

## Connect a website

Hallmark, before:

- A kicker says “New website” and the heading says “Connect a website.”
- Every field sits in one white box, with Continue and Activate as two similar rectangles.
- There is no grouping for the repository or the file paths.

Humanizer:

- The kicker is gone. The heading stays “Connect a website.”
- Owner is now “Repository owner.” Repository, branch, and adapter stay, because those words are the fields.
- The steps are Name, Repository, Files, and Report.
- Before the checks run, the report says “No report yet.”
- Errors are the same sentences as before. A bad site id still says “Use a lowercase id that starts with a letter.” A duplicate still says “That id is already used.”

After:

- The form uses the product fields, the step list, and the quiet Activate button.
- Checked at 1440, 768, and 390. The page does not scroll sideways.
- Tab reaches “Your websites,” and the focus ring is visible.
- The Harbor path still reaches the compatibility report. GitHub is not configured here, so the connection check fails and Activate stays off. The form keeps the typed values and says “Nothing was connected.”
- This route has no loading file. A client editor still sees “That page is not available.”

## Pages panel

Hallmark, before:

- The heading is a small uppercase label, “PAGES.”
- The group label is uppercase, “IN THE MENU.”
- Rows are 26 pixels tall, packed against a search field that is 28 pixels tall.
- A search with no matches says “Try part of the page name or its address.”

Humanizer:

- The heading is “Pages,” in the product serif, not small capitals.
- The group reads “In the menu.”
- A search with no matches says “No pages match” and “Use part of a name or an address.”

After:

- The panel stays in the editor’s dark surface. Type size and row height follow the product spacing.
- Harbor still lists Home, Work, Studio, Journal, and Visit. It does not list Approach.
- Opening Work changes the current page. Add page still opens the dialog, and Escape closes it without adding a page.
- Keyboard focus on Home uses the editor focus ring.
- Checked at 1440, 768, and 390. The panel fits. The editor page is 3 pixels wider than the viewport at 390, from the existing editor chrome.
- Layers and the other panels keep their previous type.

## Empty page list

There was no empty page state. A search with no matches said “No pages match.” A document with pages showed the list.

A stored draft has at least one page, so Harbor and Quantum Age cannot be saved empty. The empty branch is still in the Pages panel. It stays hidden while any page is listed. A document with zero pages, covered by the unit fixture, shows “This site has no pages yet.” and Add page.

A search that matches nothing still says “No pages match,” not the empty-document sentence. Quantum Age still lists Home and Approach. Harbor still lists its pages. Keyboard focus on Add page in that branch uses the product ring. The panel does not animate the empty card.

## Media library

Hallmark, before:

- The heading is a small uppercase label, “MEDIA.”
- The upload area is a dashed box.
- The group label is uppercase, “ALL IMAGES (0).”
- The upload line says “Drop an image here or choose a file.”

Humanizer:

- The heading is “Media.”
- The upload line is “Drop an image, or choose a file.”
- The formats stay PNG, JPEG, WebP, or SVG.
- “Used on” stays with the count. Delete stays off while that count is above zero.

After:

- The panel uses the product serif and spacing on the editor’s dark surface.
- The upload border is solid.
- A new PNG shows its size, and Delete is available because the picture is not in use.
- Checked at 1440, 768, and 390. The panel fits.
- The empty library copy is still the previous sentence. That empty state is the next step.

## Empty media library

Harbor’s library had no pictures. The old line was “No images yet,” then “Upload a picture to use it anywhere on the site.”

The empty state now says “No images have been added.” and offers Choose a file. The drop area above it still accepts a file. A search through a library that has pictures still says “No images match.” A picture that is uploaded replaces the empty state with a tile. Harbor’s empty library does not list another site’s files. Quantum Age still refuses to delete a picture that is in use.
