function removeChildren(node) {
  if(node.children === null) { return; }

  Array.from(node.children).forEach(function(c) { c.remove(); });
}

function filterChecked(nodes) {
  return Array.from(nodes).filter(n => n.checked);
}

function selectedOption(nodes) {
  selected = Array.from(nodes).filter(n => n.selected);
  if(selected.length === 0) { return null; }
  return selected[0];
}

function itemLinkChecked(n) {
  fieldItemNode = document.getElementsByName("fieldItem")[n-1];
  linkForm = fieldItemNode.querySelector("[type=text]");
  linkForm.hidden = ! linkForm.hidden;
}

function timeTableClicked(n) {
  clickedElem = document.getElementsByName("timeRange")[n-1];

  if(clickedElem.hidden) {
    for(i = 0; i < n; i++) {
      document.getElementsByName("timeTable")[i].checked = true;
      document.getElementsByName("timeRange")[i].hidden = false;
    }
  } else {
    for(i = n-1; i < 10; i++) {
      document.getElementsByName("timeTable")[i].checked = false;
      document.getElementsByName("timeRange")[i].hidden = true;
    }
  }
}

function timeRangeStr(node) {
  hourSt = selectedOption(node.querySelector('[name=hourRangeSt]').children).value;
  minSt = selectedOption(node.querySelector('[name=minuteRangeSt]').children).value;
  hourEn = selectedOption(node.querySelector('[name=hourRangeEn]').children).value;
  minEn = selectedOption(node.querySelector('[name=minuteRangeEn]').children).value;

  return hourSt + ":" + minSt + "~" + hourEn + ":" + minEn;
}

function timeRangeHTML(node) {
  hourSt = selectedOption(node.querySelector('[name=hourRangeSt]').children).value;
  minSt = selectedOption(node.querySelector('[name=minuteRangeSt]').children).value;
  hourEn = selectedOption(node.querySelector('[name=hourRangeEn]').children).value;
  minEn = selectedOption(node.querySelector('[name=minuteRangeEn]').children).value;

  return hourSt + ":" + minSt + "<br>" + hourEn + ":" + minEn;
}

function classFieldHTML(yobi, time) {
  classNameForm = "<input type='text' name='fieldName' placeholder='授業名'>";
  fieldItems = "";
  for(i = 0; i < 3; i++) {
    fieldItems += "<br>"
    node = document.getElementsByName("fieldItem")[i]
    if(node.querySelector("[type=checkbox]").checked) {
      fieldItems += "<input type='text' name='fieldLink' id=" + node.querySelector('[type=text]').value + " placeholder='" + node.querySelector("[type='text']").value + "のリンクURL'>"
    } else {
      fieldItems += "<input type='text' name='fieldText' placeholder='表示する文字'>"
    }
  }
  return "<div name='" + yobi + time + "'>" + classNameForm + fieldItems + "</div>";
}

function shapeTimesheet() {
  timesheet = document.getElementsByName("timesheet")[0];
  removeChildren(timesheet);

  yobiChecked = filterChecked(document.getElementsByName("yobi"));
  timeTableChecked = filterChecked(document.getElementsByName("timeTable"));

  /* ヘッダー(曜日の行)． */
  trHeader = document.createElement('tr');
  trHeader.appendChild(document.createElement('th')); // 左上の空白フィールド．
  yobiChecked.forEach(function(y) {
    th = document.createElement('th');
    th.textContent = y.value;
    trHeader.appendChild(th);
  });
  timesheet.appendChild(trHeader);

  /* 各行: 時限 + 各科目 */
  timeTableChecked.forEach(function(t) {
    tr = document.createElement('tr');

    /* 時限 */
    tdTime = document.createElement('td');
    tdTime.innerHTML = t.value + "<br>" + timeRangeHTML(t.nextElementSibling);
    tr.appendChild(tdTime);

    /* 各科目 */
    yobiChecked.forEach(function(y) {
      td = document.createElement('td');
      td.innerHTML = classFieldHTML(y.value, t.value);
      tr.appendChild(td);
    });
    timesheet.appendChild(tr);
  });
}

function itemJSON(node) {
  if(node.id === "") {// リンク無の場合．
    return node.value;
  }

  return { name: node.id, href: node.value };
}

function createJSONFromTimesheet() {
  json = [];

  yobiChecked = filterChecked(document.getElementsByName("yobi"));
  timeTableChecked = filterChecked(document.getElementsByName("timeTable"));
  yobiChecked.forEach(function(y) {
    yobi = y.value;
    yobiRow = [];

    timeTableChecked.forEach(function(t) {
      time = t.value;
      range = timeRangeStr(t.nextElementSibling);
      field = document.getElementsByName(yobi + time)[0]
      name = field.querySelector("[name='fieldName']").value;
      items = new Array(3);
      for(i = 0; i < 3; i++) {
        items[i] = itemJSON(field.children[(i+1)*2]);
      }
      yobiRow.push({
        time: time,
        range: range,
        classData: {
                     name: name,
                     items: items
                   }
      })
    })
    json.push({ yobi: yobi, classes: yobiRow})
  })

  return json;
}

function outputJSON() {
  document.getElementsByName("outputJSONForm")[0].value = JSON.stringify(createJSONFromTimesheet());
}

function openJSONPage() {
  var newWindow = window.open();
  newWindow.document.open();
  newWindow.document.write(JSON.stringify(createJSONFromTimesheet()));
  newWindow.document.close();
}

function classFieldOutputHTML(yobi, time) {
  html = ""
  targetField = document.getElementsByName(yobi+time)[0];

  html += "<p>" + targetField.querySelector("[name=fieldName]").value + "</p>";

  for(i = 0; i < 3; i++) {
    node = targetField.querySelectorAll("[type=text]")[i+1];
    if(node.name === "fieldText" || node.value === '') {// リンク無の場合か、リンクのURLが空の場合．
      html += "<p>" + node.value + "</p>";
    } else {
      html += "<a href='" + node.value + "'>" + node.id + "</a><br>";
    }
  }

  return html;
}

function createHTMLFromTimesheet() {
  html = ""

  yobiChecked = filterChecked(document.getElementsByName("yobi"));
  timeTableChecked = filterChecked(document.getElementsByName("timeTable"));

  /* ヘッダー(曜日の行) */
  html += "<html><table border='1'>"
  html += "<tr><th></th>" // 左端の空のフィールド、
  yobiChecked.forEach(function(y) {
    html += "<br><th>" + y.value + "</th>";
  })
  html += "</tr>"

  /* 各行: 時限 + 各科目 */
  timeTableChecked.forEach(function (t) {
    html += "<tr>";
    html += "<td>" + t.value + "<br>" + timeRangeHTML(t.nextElementSibling) + "</td>"
    yobiChecked.forEach(function (y){
      html += "<td>" + classFieldOutputHTML(y.value, t.value) + "</td>";
    })
    html += "</tr>"
  })

  html += "</table></html>"
  return html;
}

function outputHTML() {
  document.getElementsByName("outputHTMLForm")[0].value = createHTMLFromTimesheet();
}

function openHTMLPage() {
  var newWindow = window.open();
  newWindow.document.open();
  newWindow.document.write(createHTMLFromTimesheet());
  newWindow.document.close();
}

var yobiToIndex = { "月": 0, "火": 1, "水": 2, "木": 3, "金": 4, "土": 5, "日": 6 }

function reflectJSON() {
  json = JSON.parse(document.getElementsByName("pregeneratedJSON")[0].value);

  /* フィールドの各項目のリンク有無を反映． */
  fieldItems = document.querySelectorAll('[name=fieldItem]');
  linkCheckedArray = json[0]["classes"][0]["classData"]["items"];
  for(i = 0; i < 3; i++) {
    if(typeof(linkCheckedArray[i]) === "object") {
      fieldItems[i].querySelector("[type=checkbox]").checked = true;
      fieldItems[i].querySelector("[type=text]").value = linkCheckedArray[i]["name"];
      itemLinkChecked(i+1);
    }
  }

  /* 曜日データを反映． */
  json.forEach(function(yobiColumn) {
    document.getElementsByName("yobi")[ yobiToIndex[yobiColumn["yobi"]] ].checked = true;
  })

  /* 時限データを反映: 各時限の時間帯を設定して、最後の時限に対しtimeTableClicked()を呼ぶ． */
  for(i = 0; i < json[0]["classes"]; i++) {
    rangeText = json[0]["classes"][i]["range"];
    rangeSt = rangeText.slice(0,5);
    rangeEn = rangeText.slice(-5);

    /* ブラウザでの時間帯設定で行う処理を再現する． */
    timeRangeNode = document.getElementsByName("timeRange")[i];
    timeRangeNode.querySelectorAll("[name=hourRangeSt] option")[parseInt(rangeSt.slice(0,2))].selected = true;
    timeRangeNode.querySelectorAll("[name=minuteRangeSt] option")[parseInt(rangeSt.slice(3,5))/5].selected = true;
    timeRangeNode.querySelectorAll("[name=hourRangeEn] option")[parseInt(rangeEn.slice(0,2))].selected = true;
    timeRangeNode.querySelectorAll("[name=minuteRangeEn] option")[parseInt(rangeEn.slice(3,5))/5].selected = true;
    timeTableClicked(i);
  }

  /* 空の時間割表の生成 */
  shapeTimesheet();

  /* 生成した時間割表の各フィールドに反映． */
  json.forEach(function(yobiColumn) {
    yobiColumn["classes"].forEach(function(fieldData) {
      field = document.getElementsByName(yobiColumn["yobi"] + fieldData["time"])[0];
      field.querySelector("[name=fieldName]").value = fieldData["classData"]["name"];
      for(i = 0; i < 3; i++) {
        if(typeof(fieldData["classData"]["items"][i]) === "string") {// リンク無の場合．
          field.querySelectorAll("[type='text']")[i+1].value = fieldData["classData"]["items"][i]; // type='text'ならリンク有無関係なく拾える．
        } else {
          field.querySelectorAll("[type='text']")[i+1].value = fieldData["classData"]["items"][i]["href"];
        }
      }
    })
  })
}