/**
 * Scattered Dad Adventures - player feedback form builder (MOB-42).
 *
 * Run once at https://script.google.com (New project -> paste -> Run buildFeedbackForm).
 * Creates, in the signed-in account's Drive:
 *   1. Google Form "Scattered Dad Adventures - Field Report" (no sign-in or email required)
 *   2. Linked response Sheet "Scattered Dad Adventures - Field Reports (Responses)"
 * and logs (View -> Execution log):
 *   - public form URL, edit URL, response Sheet URL
 *   - FEEDBACK_FORM config block for the game: viewform base URL + entry IDs of the
 *     auto-filled fields (version, build, floor, class, screen) so the in-game button can
 *     open a prefilled link.
 * Running it again creates a second, separate form; it never edits or deletes anything.
 */

var FORM_TITLE = "Scattered Dad Adventures - Field Report";

// Prefill tokens: placeholder answers used only to discover each field's entry ID.
var PREFILL = {
  version: "TOKEN_VERSION",
  build: "TOKEN_BUILD",
  floor: "TOKEN_FLOOR",
  cls: "TOKEN_CLASS",
  screen: "TOKEN_SCREEN"
};

function buildFeedbackForm() {
  var form = FormApp.create(FORM_TITLE);
  form.setDescription(
    "Something broke, looked wrong, or made you laugh? File a Field Report.\n" +
    "The Department of Dad Affairs reads every one. No account needed, and contact info is optional.\n\n" +
    "Thank you for playing. Reports like yours are how the game gets better."
  );
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(true);
  form.setPublishingSummary(false);
  form.setConfirmationMessage(
    "Report filed. Your contribution has been noted in the permanent record, " +
    "which is a spreadsheet. Now go hydrate."
  );

  // --- Player-written fields ---
  form.addMultipleChoiceItem()
    .setTitle("What kind of report is this?")
    .setChoiceValues([
      "Bug - something broke",
      "Looks wrong - display, layout, or art",
      "Controls - tapping, swiping, or buttons misbehaved",
      "Balance - too hard, too easy, or unfair",
      "Idea - feature or content suggestion",
      "Praise - something worked great"
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle("What happened?")
    .setHelpText("Describe it like an incident report to the HOA: what you saw, and what you expected instead.")
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle("What were you doing right before?")
    .setHelpText("Steps help reproduce bugs. Example: opened BAG, tapped THROW, picked the spatula.")
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle("How much did it affect your run?")
    .setChoiceValues([
      "Didn't affect play",
      "Annoying but playable",
      "Had to restart or reload",
      "Lost my run or save",
      "Game wouldn't load",
      "Not a problem report"
    ])
    .setRequired(false);

  form.addScaleItem()
    .setTitle("Overall, how much fun are you having?")
    .setBounds(1, 5)
    .setLabels("Not fun", "Very fun")
    .setRequired(false);

  form.addTextItem()
    .setTitle("Device and browser")
    .setHelpText("Example: Galaxy S25+, Chrome / iPhone 13, Safari / Windows laptop, Edge")
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle("Is the game installed to your home screen?")
    .setChoiceValues(["Yes", "No", "Not sure"])
    .setRequired(false);

  // --- Auto-filled by the game ---
  form.addSectionHeaderItem()
    .setTitle("Game details")
    .setHelpText("Filled in by the game when you use the in-game Feedback button. Leave these as they are.");

  var items = {
    version: form.addTextItem().setTitle("Game version"),
    build: form.addTextItem().setTitle("Build"),
    floor: form.addTextItem().setTitle("Floor"),
    cls: form.addTextItem().setTitle("Dad class"),
    screen: form.addTextItem().setTitle("Screen size")
  };

  // --- Optional contact ---
  form.addSectionHeaderItem().setTitle("Want a reply?");
  form.addTextItem()
    .setTitle("Email or other contact (optional)")
    .setHelpText("Only if you want a follow-up. Leave blank to stay anonymous.")
    .setRequired(false);

  // --- Response sheet ---
  var ss = SpreadsheetApp.create("Scattered Dad Adventures - Field Reports (Responses)");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // Newer Forms accounts create forms unpublished; publish if the method exists.
  if (typeof form.setPublished === "function") form.setPublished(true);
  form.setAcceptingResponses(true);

  // --- Prefill link -> entry IDs ---
  var resp = form.createResponse();
  Object.keys(items).forEach(function (k) {
    resp = resp.withItemResponse(items[k].createResponse(PREFILL[k]));
  });
  var prefillUrl = resp.toPrefilledUrl();
  var base = prefillUrl.split("?")[0];
  var entries = {};
  Object.keys(PREFILL).forEach(function (k) {
    var m = prefillUrl.match(new RegExp("(entry\\.\\d+)=" + PREFILL[k]));
    entries[k] = m ? m[1] : "NOT_FOUND";
  });

  var config =
    "var FEEDBACK_FORM = {\n" +
    "  url: \"" + base + "\",\n" +
    "  entries: " + JSON.stringify(entries) + "\n" +
    "};";

  Logger.log("Public form URL:  " + form.getPublishedUrl());
  Logger.log("Edit form URL:    " + form.getEditUrl());
  Logger.log("Response sheet:   " + ss.getUrl());
  Logger.log("Prefill example:  " + prefillUrl);
  Logger.log("Game config (paste into a KBP note on MOB-42):\n" + config);

  return { formUrl: form.getPublishedUrl(), editUrl: form.getEditUrl(), sheetUrl: ss.getUrl(), config: config };
}
