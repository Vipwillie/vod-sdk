(function ($) {
    function upload(element, options) {
        "use strict";
        var me = this;
        var dom = element;
        var filePicker = options.filePicker || "picker";//选择文件
        var startUploadBtn = options.startUploadBtn || "startUpload";//开始上传按钮
        var fileContainer = options.fileContainer || "fileContainer";//文件容器
        var uploader = null;
        var autoUpload = options.autoUpload || false;
        var server = options.server || "";
        var swf = options.swf || "";
        this.init = function () {
            if (options.muiltFileUpload) {
                $(element).append(getMuiltFileUploadStyle());
                this.uploader = this.createWebUploader();
                muiltFileUpload(this.uploader);
            } else {
                /*
                 * TODO 传入一个容器
                 * 通过id指定容器，将单文件导入的div画到界面上
                 */
                $(element).append(getSingleFileUploadStyle());
                this.uploader = this.createWebUploader();
                blindSingleFileUploadListener(this.uploader);
                // 文件上传成功，给item添加成功class, 用样式标记上传成功。
                this.uploader.on('uploadSuccess', function (file, data) {
                    $('#' + file.id).addClass('upload-state-done');
                    options.uploadSuccess(file, data);
                });

                if (!this.autoUpload) {
                    $("#" + startUploadBtn).click(function () {
                        me.fileUplod();
                    });
                }
            }
        }

        /*
        * 创建 webuploader实例
        */
        this.createWebUploader = function () {
            return WebUploader.create({
                // 选完文件后，是否自动上传。
                auto: autoUpload,

                // swf文件路径
                swf: swf,

                // 文件接收服务端。
                server: server,

                // 选择文件的按钮。可选。
                // 内部根据当前运行是创建，可能是input元素，也可能是flash.
                pick: {
                    id: "#" + filePicker,
                    label: "选择图片"
                },

                // 只允许选择图片文件。
                accept: {
                    title: 'Images',
                    extensions: 'gif,jpg,jpeg,bmp,png',
                    mimeTypes: 'image/*'
                }
            });
        },
            /*
            *  文件上传
            */
            this.fileUplod = function () {
                this.uploader.upload();
            }

        function blindSingleFileUploadListener(uploader) {
            // 当有文件添加进来的时候
            uploader.on('fileQueued', function (file) {
                var $list = $("#" + fileContainer),
                    $img = $list.find('img');
                $list.find(".img-thumbnail").attr("id", file.id);
                // 创建缩略图
                // 如果为非图片文件，可以不用调用此方法。
                // thumbnailWidth x thumbnailHeight 为 100 x 100
                uploader.makeThumb(file, function (error, src) {
                    if (error) {
                        $img.replaceWith('<span>不能预览</span>');
                        return;
                    }

                    $img.attr('src', src);
                }, "100", "100");
                $("#" + startUploadBtn).attr("disabled", false);
            });

            // 文件上传过程中创建进度条实时显示。
            uploader.on('uploadProgress', function (file, percentage) {
                var $li = $('#' + file.id),
                    $percent = $li.find('.progress span');

                // 避免重复创建
                if (!$percent.length) {
                    $percent = $('<p class="progress progress-striped active"><span class="progress-bar" role="progressbar" style="width: 0%"></span></p>')
                        .appendTo($li)
                        .find('span');
                }

                $percent.css('width', percentage * 100 + '%');
            });

            // 文件上传失败，显示上传出错。
            uploader.on('uploadError', function (file) {
                var $li = $('#' + file.id),
                    $error = $li.find('div.error');

                // 避免重复创建
                if (!$error.length) {
                    $error = $('<div class="error"></div>').appendTo($li);
                }
                $error.text('上传失败');
            });

            // 完成上传完了，成功或者失败，先删除进度条。
            uploader.on('uploadComplete', function (file) {
                $('#' + file.id).find('.progress').fadeOut();
                $("#" + startUploadBtn).attr("disabled", true);
            });
        }

        function muiltFileUpload(uploader) {
            uploader.dnd = "#dndArea";
            uploader.paste = "#uploader";
            uploader.disableGlobalDnd = true;// 禁掉全局的拖拽功能。这样不会出现图片拖进页面的时候，把图片打开。

            muiltFileInit(uploader);

        }

        function muiltFileInit(uploader) {
            var $wrap = $('#uploader'),
                // 图片容器
                $queue = $('<ul class="filelist"></ul>').appendTo($wrap.find('.queueList')),

                // 状态栏，包括进度和控制按钮
                $statusBar = $wrap.find('.statusBar'),

                // 文件总体选择信息。
                $info = $statusBar.find('.info'),

                // 上传按钮
                $upload = $wrap.find('.uploadBtn'),

                // 没选择文件之前的内容。
                $placeHolder = $wrap.find('.placeholder'),

                $progress = $statusBar.find('.progress').hide(),

                // 添加的文件数量
                fileCount = 0,

                // 添加的文件总大小
                fileSize = 0,

                // 优化retina, 在retina下这个值是2
                ratio = window.devicePixelRatio || 1,

                // 缩略图大小
                thumbnailWidth = 110 * ratio,
                thumbnailHeight = 110 * ratio,

                // 可能有pedding, ready, uploading, confirm, done.
                state = 'pedding',

                // 所有文件的进度信息，key为file id
                percentages = {},
                // 判断浏览器是否支持图片的base64
                isSupportBase64 = supportBase64(),

                // 检测是否已经安装flash，检测flash的版本
                flashVersion = getFlashVersion(),

                supportTransition = (function () {
                    var s = document.createElement('p').style,
                        r = 'transition' in s ||
                            'WebkitTransition' in s ||
                            'MozTransition' in s ||
                            'msTransition' in s ||
                            'OTransition' in s;
                    s = null;
                    return r;
                })(),
                swf = swf,
                // WebUploader实例
                uploader = uploader;

            if (!WebUploader.Uploader.support('flash') && WebUploader.browser.ie) {
                // flash 安装了但是版本过低。
                if (flashVersion) {
                    (function (container) {
                        window['expressinstallcallback'] = function (state) {
                            switch (state) {
                                case 'Download.Cancelled':
                                    alert('您取消了更新！')
                                    break;

                                case 'Download.Failed':
                                    alert('安装失败')
                                    break;

                                default:
                                    alert('安装已成功，请刷新！');
                                    break;
                            }
                            delete window['expressinstallcallback'];
                        };

                        // insert flash object
                        var html = '<object type="application/' +
                            'x-shockwave-flash" data="' + swf + '" ';

                        if (WebUploader.browser.ie) {
                            html += 'classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" ';
                        }

                        html += 'width="100%" height="100%" style="outline:0">' +
                            '<param name="movie" value="' + swf + '" />' +
                            '<param name="wmode" value="transparent" />' +
                            '<param name="allowscriptaccess" value="always" />' +
                            '</object>';

                        container.html(html);

                    })($wrap);

                    // 压根就没有安转。
                } else {
                    $wrap.html('<a href="http://www.adobe.com/go/getflashplayer" target="_blank" border="0"><img alt="get flash player" src="http://www.adobe.com/macromedia/style_guide/images/160x41_Get_Flash_Player.jpg" /></a>');
                }
                return;
            } else if (!WebUploader.Uploader.support()) {
                alert('Web Uploader 不支持您的浏览器！');
                return;
            }

            // 拖拽时不接受 js, txt 文件。
            uploader.on('dndAccept', function (items) {
                var denied = false,
                    len = items.length,
                    i = 0,
                    // 修改js类型
                    unAllowed = 'text/plain;application/javascript ';

                for (; i < len; i++) {
                    // 如果在列表里面
                    if (~unAllowed.indexOf(items[i].type)) {
                        denied = true;
                        break;
                    }
                }

                return !denied;
            });

            // uploader.on('filesQueued', function() {
            //     uploader.sort(function( a, b ) {
            //         if ( a.name < b.name )
            //           return -1;
            //         if ( a.name > b.name )
            //           return 1;
            //         return 0;
            //     });
            // });

            // 添加“添加文件”的按钮，
            uploader.addButton({
                id: '#filePicker2',
                label: '继续添加'
            });

            uploader.on('ready', function () {
                window.uploader = uploader;
            });

            // 当有文件添加进来时执行，负责view的创建
            function addFile(file) {
                var $li = $('<li id="' + file.id + '">' +
                    '<p class="title">' + file.name + '</p>' +
                    '<p class="imgWrap"></p>' +
                    '</li>'),

                    $btns = $('<div class="file-panel">' +
                        '<span class="cancel">删除</span>' +
                        '<span class="rotateRight">向右旋转</span>' +
                        '<span class="rotateLeft">向左旋转</span></div>').appendTo($li),
                    $prgress = $li.find('p.progress span'),
                    $wrap = $li.find('p.imgWrap'),
                    $info = $('<p class="error"></p>'),
                    text = "",
                    showError = function (code) {
                        switch (code) {
                            case 'exceed_size':
                                text = '文件大小超出';
                                break;

                            case 'interrupt':
                                text = '上传暂停';
                                break;

                            default:
                                text = '上传失败，请重试';
                                break;
                        }

                        $info.text(text).appendTo($li);
                    };

                if (file.getStatus() === 'invalid') {
                    showError(file.statusText);
                } else {
                    // @todo lazyload
                    $wrap.text('预览中');
                    uploader.makeThumb(file, function (error, src) {
                        var img;

                        if (error) {
                            $wrap.text('不能预览');
                            return;
                        }

                        if (isSupportBase64) {
                            img = $('<img src="' + src + '">');
                            $wrap.empty().append(img);
                        } else {
                            /* $.ajax('../../server/preview.php', {
                                 method: 'POST',
                                 data: src,
                                 dataType: 'json'
                             }).done(function (response) {
                                 if (response.result) {
                                     img = $('<img src="' + response.result + '">');
                                     $wrap.empty().append(img);
                                 } else {
                                     $wrap.text("预览出错");
                                 }
                             });*/
                        }
                    }, thumbnailWidth, thumbnailHeight);

                    percentages[file.id] = [file.size, 0];
                    file.rotation = 0;
                }

                file.on('statuschange', function (cur, prev) {
                    if (prev === 'progress') {
                        $prgress.hide().width(0);
                    } else if (prev === 'queued') {
                        $li.off('mouseenter mouseleave');
                        $btns.remove();
                    }

                    // 成功
                    if (cur === 'error' || cur === 'invalid') {
                        showError(file.statusText);
                        percentages[file.id][1] = 1;
                    } else if (cur === 'interrupt') {
                        showError('interrupt');
                    } else if (cur === 'queued') {
                        percentages[file.id][1] = 0;
                    } else if (cur === 'progress') {
                        $info.remove();
                        $prgress.css('display', 'block');
                    } else if (cur === 'complete') {
                        $li.append('<span class="success"></span>');
                    }

                    $li.removeClass('state-' + prev).addClass('state-' + cur);
                });

                $li.on('mouseenter', function () {
                    $btns.stop().animate({height: 30});
                });

                $li.on('mouseleave', function () {
                    $btns.stop().animate({height: 0});
                });

                $btns.on('click', 'span', function () {
                    var index = $(this).index(),
                        deg;

                    switch (index) {
                        case 0:
                            uploader.removeFile(file);
                            return;

                        case 1:
                            file.rotation += 90;
                            break;

                        case 2:
                            file.rotation -= 90;
                            break;
                    }

                    if (supportTransition) {
                        deg = 'rotate(' + file.rotation + 'deg)';
                        $wrap.css({
                            '-webkit-transform': deg,
                            '-mos-transform': deg,
                            '-o-transform': deg,
                            'transform': deg
                        });
                    } else {
                        $wrap.css('filter', 'progid:DXImageTransform.Microsoft.BasicImage(rotation=' + (~~((file.rotation / 90) % 4 + 4) % 4) + ')');
                        // use jquery animate to rotation
                        // $({
                        //     rotation: rotation
                        // }).animate({
                        //     rotation: file.rotation
                        // }, {
                        //     easing: 'linear',
                        //     step: function( now ) {
                        //         now = now * Math.PI / 180;

                        //         var cos = Math.cos( now ),
                        //             sin = Math.sin( now );

                        //         $wrap.css( 'filter', "progid:DXImageTransform.Microsoft.Matrix(M11=" + cos + ",M12=" + (-sin) + ",M21=" + sin + ",M22=" + cos + ",SizingMethod='auto expand')");
                        //     }
                        // });
                    }


                });

                $li.appendTo($queue);
            }

            // 负责view的销毁
            function removeFile(file) {
                var $li = $('#' + file.id);

                delete percentages[file.id];
                updateTotalProgress();
                $li.off().find('.file-panel').off().end().remove();
            }

            function updateTotalProgress() {
                var loaded = 0,
                    total = 0,
                    spans = $progress.children(),
                    percent;

                $.each(percentages, function (k, v) {
                    total += v[0];
                    loaded += v[0] * v[1];
                });

                percent = total ? loaded / total : 0;


                spans.eq(0).text(Math.round(percent * 100) + '%');
                spans.eq(1).css('width', Math.round(percent * 100) + '%');
                updateStatus();
            }

            function updateStatus() {
                var text = '', stats;

                if (state === 'ready') {
                    text = '选中' + fileCount + '张图片，共' +
                        WebUploader.formatSize(fileSize) + '。';
                } else if (state === 'confirm') {
                    stats = uploader.getStats();
                    if (stats.uploadFailNum) {
                        text = '已成功上传' + stats.successNum + '张照片至XX相册，' +
                            stats.uploadFailNum + '张照片上传失败，<a class="retry" href="#">重新上传</a>失败图片或<a class="ignore" href="#">忽略</a>'
                    }

                } else {
                    stats = uploader.getStats();
                    text = '共' + fileCount + '张（' +
                        WebUploader.formatSize(fileSize) +
                        '），已上传' + stats.successNum + '张';

                    if (stats.uploadFailNum) {
                        text += '，失败' + stats.uploadFailNum + '张';
                    }
                }

                $info.html(text);
            }

            function setState(val) {
                var file, stats;

                if (val === state) {
                    return;
                }

                $upload.removeClass('state-' + state);
                $upload.addClass('state-' + val);
                state = val;

                switch (state) {
                    case 'pedding':
                        $placeHolder.removeClass('element-invisible');
                        $queue.hide();
                        $statusBar.addClass('element-invisible');
                        uploader.refresh();
                        break;

                    case 'ready':
                        $placeHolder.addClass('element-invisible');
                        $('#filePicker2').removeClass('element-invisible');
                        $queue.show();
                        $statusBar.removeClass('element-invisible');
                        uploader.refresh();
                        break;

                    case 'uploading':
                        $('#filePicker2').addClass('element-invisible');
                        $progress.show();
                        $upload.text('暂停上传');
                        break;

                    case 'paused':
                        $progress.show();
                        $upload.text('继续上传');
                        break;

                    case 'confirm':
                        $progress.hide();
                        $('#filePicker2').removeClass('element-invisible');
                        $upload.text('开始上传');

                        stats = uploader.getStats();
                        if (stats.successNum && !stats.uploadFailNum) {
                            setState('finish');
                            return;
                        }
                        break;
                    case 'finish':
                        stats = uploader.getStats();
                        if (stats.successNum) {
                            alert('上传成功');
                        } else {
                            // 没有成功的图片，重设
                            state = 'done';
                            location.reload();
                        }
                        break;
                }

                updateStatus();
            }

            uploader.onUploadProgress = function (file, percentage) {
                var $li = $('#' + file.id),
                    $percent = $li.find('.progress span');

                $percent.css('width', percentage * 100 + '%');
                percentages[file.id][1] = percentage;
                updateTotalProgress();
            };

            uploader.onFileQueued = function (file) {
                fileCount++;
                fileSize += file.size;

                if (fileCount === 1) {
                    $placeHolder.addClass('element-invisible');
                    $statusBar.show();
                }

                addFile(file);
                setState('ready');
                updateTotalProgress();
            };

            uploader.onFileDequeued = function (file) {
                fileCount--;
                fileSize -= file.size;

                if (!fileCount) {
                    setState('pedding');
                }

                removeFile(file);
                updateTotalProgress();

            };

            uploader.on('all', function (type) {
                var stats;
                switch (type) {
                    case 'uploadFinished':
                        setState('confirm');
                        break;

                    case 'startUpload':
                        setState('uploading');
                        break;

                    case 'stopUpload':
                        setState('paused');
                        break;

                }
            });

            uploader.onError = function (code) {
                alert('Eroor: ' + code);
            };

            $upload.on('click', function () {
                if ($(this).hasClass('disabled')) {
                    return false;
                }

                if (state === 'ready') {
                    console.info(uploader.server);
                    uploader.upload();
                } else if (state === 'paused') {
                    uploader.upload();
                } else if (state === 'uploading') {
                    uploader.stop();
                }
            });

            $info.on('click', '.retry', function () {
                uploader.retry();
            });

            $info.on('click', '.ignore', function () {
                alert('todo');
            });

            $upload.addClass('state-' + state);
            updateTotalProgress();
        }

        function supportBase64() {
            var data = new Image();
            var support = true;
            data.onload = data.onerror = function () {
                if (this.width != 1 || this.height != 1) {
                    support = false;
                }
            }
            data.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
            return support;
        }

        function getFlashVersion() {
            var version;
            try {
                version = navigator.plugins['Shockwave Flash'];
                version = version.description;
            } catch (ex) {
                try {
                    version = new ActiveXObject('ShockwaveFlash.ShockwaveFlash')
                        .GetVariable('$version');
                } catch (ex2) {
                    version = '0.0';
                }
            }
            version = version.match(/\d+/g);
            return parseFloat(version[0] + '.' + version[1], 10);
        }

        function getSingleFileUploadStyle() {
            return '<div id="container">' +
                '<div class="row wu-example">' +
                '<div id="' + fileContainer + '" class="uploader-list">' +
                '<table>' +
                '<tr>' +
                '<td align="center">' +
                '<div class="img-thumbnail">' +
                '<img src="../image/image.png" style="width: 100%;height: 100%;"/>' +
                '</div>' +
                '</td>' +
                '</tr>' +
                '<tr>' +
                '<td>' +
                '<div class="btns">' +
                '<div id="' + filePicker + '" class="btn">选择图片</div>' +
                '<button class="btn btn-default" id="' + startUploadBtn + '" style="width:86px;height:40px;" type="button">开始上传</button>' +
                '</div>' +
                '</td>' +
                '</tr>' +
                '</table>' +
                '</div>' +
                '</div>' +
                '</div>';
        }

        function getMuiltFileUploadStyle() {
            return '<div id="container">' +
                '<div id="uploader">' +
                '<div class="queueList">' +
                '<div id="dndArea" class="placeholder">' +
                '<div id="' + filePicker + '"></div>' +
                '<p>或将照片拖到这里，单次最多可选300张</p>' +
                '</div>' +
                '</div>' +
                '<div class="statusBar" style="display:none;">' +
                '<div class="progress">' +
                '<span class="text">0%</span>' +
                '<span class="percentage"></span>' +
                '</div>' +
                '<div class="info"></div>' +
                '<div class="btns">' +
                '<div id="filePicker2"></div><div class="uploadBtn">开始上传</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';
        }
    }

    $.fn.upload = function (options) {
        var settings = {
            filePicker: "picker",//选择文件
            startUploadBtn: "startUpload",//开始上传按钮
            fileContainer: "fileContainer",//文件容器
            autoUpload: false,//自动上传
            swf: "",
            server: "", //上传调用接口
            muiltFileUpload: false, //多文件上传
            uploadSuccess: function (file, data) {
            }//上传成功事件
        }

        var params = $.extend({}, settings, options);

        var webuploader = new upload($(this), params);

        webuploader.init();
        return webuploader;
    }
})(jQuery);