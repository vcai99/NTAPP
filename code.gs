function doGet(e) {
  const page = ((e && e.parameter && e.parameter.page) || 'dashboard').toLowerCase();
  const tmpl = HtmlService.createTemplateFromFile('app');
  tmpl.BASE_URL = ScriptApp.getService().getUrl();
  tmpl.activePage = page;
  return tmpl.evaluate()
    .setTitle('Phần mềm Nhà thuốc An Phúc')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
