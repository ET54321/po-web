import $ from "jquery";

import observable from "riot-observable";
import webclientUI from "./frontend";
import {onEnterPressed,timestamp} from "./utils";

var chatHtml =`
    <div class="chat">

    </div>

    <div class="chatInputContainer">
      <input type="text" class="form-control chatInput" placeholder="Type your message..." history>
    </div>`;

// At least Chrome (I assume other browsers do the same) expand <timestamp/> to <timestamp><timestamp/> (as it is an unknown element).
var timestampRegex = /<timestamp *\/ *>|<timestamp><\/timestamp>/gi;

export default function Chat() {
    observable(this);

    this.element = $("<div class='flex-column chat-column'>").html(chatHtml);
    if (webclientUI.players.showColors) {
        this.element.addClass("rainbow");
    }
    this.chatTextArea = this.element.find(".chat");
    this.chatSend = this.element.find(".chatInput");
    this.chatCount = 0;

    var self = this;
    this.chatSend.keydown(onEnterPressed(function () {
        if ($(this).val().length > 0) {
            self.trigger("chat", $(this).val());
        }
        //$(this).val('');
    }));
}

Chat.prototype.disable = function() {
    this.chatSend.prop("disabled", true);
};

Chat.prototype.insertMessage = function (msg, opts) {
    var chatTextArea = this.chatTextArea;
    var cta = chatTextArea[0];
    var scrollDown = cta.scrollTop >= cta.scrollHeight - cta.offsetHeight;
    var timestampPart;

    opts = opts || {};

    if (opts.timestamps) {
        timestampPart = "<span class='timestamp'>(" + timestamp() + ")</span> ";
        if (opts.html) {
            msg = msg.replace(timestampRegex, timestampPart);
        } else if (msg) {
            msg = timestampPart + msg;
        }
    }

    if (opts.linebreak) {
        msg += "<br/>";
    }

    chatTextArea.append("<div class='chat-line'>" + msg + "</div>");

    /* Limit number of lines */
    if (this.chatCount++ % 100 === 0) {
        chatTextArea.html(chatTextArea.find(".chat-line").slice(-500));
    }

    if (scrollDown) {
        this.scrollDown();
    }
};

Chat.prototype.scrollDown = function() {
    //this.chatTextArea.finish().animate({scrollTop: this.chatTextArea[0].scrollHeight}, "fast");
    this.chatTextArea.scrollTop(this.chatTextArea[0].scrollHeight);
};

export function  afterLoad () {
    var maxHistSize = 100;
    $(document).on("keydown", "[history]", function (event) {
        var elem = event.currentTarget;

        elem.hist = elem.hist || [];
        elem.histIndex = elem.histIndex || 0;
        if (event.which === 38) { // Up
            if (elem.histIndex === elem.hist.length && elem.value.match(/\S/)) {
                elem.hist.push(elem.value);
                if (elem.hist.length > maxHistSize) {
                    elem.hist.shift();
                }
            }
            if (elem.histIndex > 0) {
                let str = elem.hist[--elem.histIndex];
                elem.value = str;
                setTimeout(function(){
                    elem.setSelectionRange(str.length, str.length);
                });
            }
        } else if (event.which === 40) { // Down
            if (elem.histIndex < elem.hist.length) {
                let str = elem.hist[++elem.histIndex] || ""
                elem.value = str;
                setTimeout(function(){
                    elem.setSelectionRange(str.length, str.length);
                });
            }
        } else if (event.which === 13) { // Return
            if (!elem.value.length) {
                return;
            }
            elem.hist.push(elem.value);
            if (elem.hist.length > maxHistSize) {
                elem.hist.shift();
            }
            elem.histIndex = elem.hist.length;
            elem.value = "";
        }
    });
}
