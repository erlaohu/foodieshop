/*!
 * Created by zx1984 on 2017/6/11.
 * https://github.com/zx1984/calendar-price-jquery
 */
'use strict';

(function($) {

    /**
     * 数字格式化
     * @param n number
     */
    var formatNumber = function(n) {
        n = n.toString();
        return n[1] ? n : '0' + n;
    };

    /**
     * 转整数
     * @param n
     * @returns {*}
     */
    var toNumber = function(n) {
        n = parseInt(n);
        return isNaN(n) ? 0 : n;
    };

    // 判断日期是否合法
    var isValid = function(date) {
        if (/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})/.test(date)) {
            return RegExp.$1 + '/' + formatNumber(RegExp.$2) + '/' + formatNumber(RegExp.$3);
        }
        return false;
    };

    /**
     * 日期格式化
     * @param date 日期对象 new Date()
     * @param fmt format 输出日期格式 yyyy-MM-dd hh:mm:ss
     */
    var formatDate = function(date, fmt) {
        if (/(y+)/i.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
        }

        var obj = {
            'M+': date.getMonth() + 1,
            'd+': date.getDate(),
            'h+': date.getHours(),
            'm+': date.getMinutes(),
            's+': date.getSeconds()
        }

        for (var key in obj) {
            if (new RegExp('(' + key + ')').test(fmt)) {
                var str = obj[key] + '';
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? str : formatNumber(str));
            }
        }
        return fmt;
    };

    /**
     * 等待时间
     * @param s 秒
     */
    var sleep = function(s) {
        for(var t = Date.now();Date.now() - t <= s;);
    };

    var CODES = {
        1: '请配置日历显示的容器!',
        2: '{{text}}: 日期格式不合法!',
        3: '没有选中的日期!',
        4: '开始日期格式错误',
        5: '开始日期不能小于今天',
        6: '结束日期格式错误',
        7: '结束日期不能小于开始日期',
        8: 'sort(arg)方法的参数arg为非数组',
        9: 'update(data) 参数data必须为数组',
        10: '售价和库存必须输入',
        11: '全年保存的时候，请选择要保存的星期'
    }

    // 系统当前时间对象
    var TODAY = new Date();

    var today = formatDate(TODAY, 'yyyy-MM-dd');

    // 一天毫秒数
    var ONE_DAY_MSEC = 86400000;

    var tomorrow = formatDate(new Date(Date.parse(TODAY) + ONE_DAY_MSEC), 'yyyy-MM-dd');

    // 默认配置项
    var DEFAULTS = {
        data: [],
        // 日历显示月份，不能小于系统当前月份
        month: formatDate(TODAY, 'yyyy/MM'),
        // 开始日期，未设置则默认为当前系统时间
        startDate: formatDate(TODAY, 'yyyy/MM/dd'),
        // 日历结束月份，
        endDate: null,
        // 取得数据
        getData: function() {},
        // 保存执行函数
        save: function(setData, dateArr) {},
        // 刪除执行函数
        delete: function(dateArr) {},
        // 异常/错误回调
        error: function(err) {
            $(".error-msg").text(err.msg);
        },
        // 配置需要设置的字段名称
        config: [
            {
                key: 'price',
                name: '售价'
            },
            // {
            //     key: 'childPrice',
            //     name: '儿童售价'
            // },
            {
                key: 'stock',
                name: '库存'
            }
        ],
        // 配置在日历中要显示的字段
        show: [
            {
                key: 'price',
                name: '售价：'
            },
            // {
            //     key: 'childPrice',
            //     name: '儿童售价：'
            // },
            {
                key: 'stock',
                name: '库存：'
            }
        ],
        hideFooterButton: true,
        style: {
            bgColor: '#fff',
            // 头部背景色
            headerBgColor: '#d9edf7',
            // 头部文字颜色
            headerTextColor: '#3a87ad',
            // 周一至周日背景色，及文字颜色
            weekBgColor: '#d9edf7',
            weekTextColor: '#3a87ad',
            // 周末背景色，及文字颜色
            weekendBgColor: '#098cc2',
            weekendTextColor: '#fff',
            // 有效日期颜色
            validDateTextColor: '#333',
            validDateBgColor: '#fff',
            validDateBorderColor: '#eee',
            // Hover
            validDateHoverBgColor: '#d9edf7',
            // 无效日期颜色
            invalidDateTextColor: '#ccc',
            invalidDateBgColor: '#fff',
            invalidDateBorderColor: '#eee',
            // 底部背景颜色
            footerBgColor: '#fff',
            // 重置按钮颜色
            resetBtnBgColor: '#77c351',
            resetBtnTextColor: '#fff',
            resetBtnHoverBgColor: '#55b526',
            resetBtnHoverTextColor: '#fff',
            // 确定按钮
            confirmBtnBgColor: '#098cc2',
            confirmBtnTextColor: '#fff',
            confirmBtnHoverBgColor: '#00649a',
            confirmBtnHoverTextColor: '#fff',
            // 取消按钮
            cancelBtnBgColor: '#fff',
            cancelBtnBorderColor: '#bbb',
            cancelBtnTextColor: '#999',
            cancelBtnHoverBgColor: '#fff',
            cancelBtnHoverBorderColor: '#bbb',
            cancelBtnHoverTextColor: '#666'
        }
    };

    /**
     * 日历价格设置jQ插件
     * @param opts
     * @constructor
     */
    function CalendarPrice(opts) {

        // 日历显示容器
        if (!opts.el || !opts.settingEl) {
            opts.error && opts.error({
                code: 1,
                msg: CODES[1]
            })
        }

        // 日历容器
        this.calendar = $(opts.el);
        // 日历设置
        this.settingWindow = $(opts.settingEl);
        // 扩展
        this.opts = $.extend({}, DEFAULTS, opts);
        // 数据设置
        this.opts.data = this.opts.getData();
        // 初始化
        this.init();
    };

    // prototype
    var fn = CalendarPrice.prototype;

    /**
     * 格式化月份
     * @param month
     * @returns {string}
     * @private
     */
    fn._formatThisMonth = function(month) {

        var thisMonthObj = null;

        if (/^(\d{4})[-\.\/](\d{1,2})/.test(month)) {
            thisMonthObj = this.dateToObject(RegExp.$1 + '/' + RegExp.$2);
        } else {
            thisMonthObj = this.dateToObject(formatDate(TODAY, 'yyyy/MM'));
        }

        // 是否在开始日期/结束日期内
        if (thisMonthObj <= this.endDate && thisMonthObj >= this.startDate) {
            return thisMonthObj;
        } else {
            return this.dateToObject(formatDate(this.startDate, 'yyyy/MM'));
        }
    };

    /**
     * 初始化日历
     */
    fn.init = function() {

        // 开始日期对象
        this.startDate = this._getStartDate();
        // 结束日期对象
        this.endDate = this._getEndDate();
        // 日期价格数据
        this.data = this._getOptionsData();
        // 当前显示月份
        this.month = this._formatThisMonth(this.opts.month);

        // 创建this.month日历
        this.createCalendar();
        // 日历按钮点击处理
        this.handleCalendarClickEvent();
        // 单日详情设置
        this.initSettingWindow();
        // 设置按钮点击处理
        this.handleClickEvent();
    };

    /**
     * Clear All
     * @private
     */
    fn._clearAll = function() {
        // 清空选中状态
        $('.selectedDate').removeClass('selectedDate');
        // 清空checkbox
        this.settingWindow.find('[type="checkbox"]').prop('checked', false);
        // 栏目标题
        this.settingWindow.find('.cddsw-title-count').html($('.selectedDate').length);
        // 错误信息删除
        $(".error-msg").text('');
    };

    /**
     * Prev Month
     * @private
     */
    fn._prevMonth = function() {
        var y = toNumber(formatDate(this.month, 'yyyy'));
        var m = toNumber(formatDate(this.month, 'MM'));
        if (m === 1) {
            this.month = this.dateToObject((y - 1) + '/12');
        } else {
            this.month = this.dateToObject(y + '/' + (m - 1));
        }
        this.createCalendar();
        this.handleCalendarClickEvent();
    };

    /**
     * Next Month
     * @private
     */
    fn._nextMonth = function() {
        var y = toNumber(formatDate(this.month, 'yyyy'));
        var m = toNumber(formatDate(this.month, 'MM'));
        if (m === 12) {
            this.month = this.dateToObject((y + 1) + '/01');
        } else {
            this.month = this.dateToObject(y + '/' + (m + 1));
        }
        this.createCalendar();
        this.handleCalendarClickEvent();
    };

    /**
     * 获取开始日期
     * @return 开始日期 >= 今天
     * @private
     */
    fn._getStartDate = function() {
        var startDate = this.dateToObject(this.opts.startDate);
        if (startDate && startDate >= TODAY) {
            return startDate;
        } else {
            return TODAY;
        }
    };

    /**
     * 获取结束日期
     * @private
     */
    fn._getEndDate = function() {
        var endDate = this.opts.endDate;
        var y = null,
            m = null,
            d = null;
        // 结束日期为0000-00，则转为0000-00-月末日期
        if (/^(\d{4})[-\.\/](\d{1,2})/.test(endDate)) {
            y = RegExp.$1;
            m = toNumber(RegExp.$2);
        }

        // 取结束日期为1年后的今天
        if (!y || !m) {
            y = toNumber(formatDate(TODAY, 'yyyy')) + 1;
            m = toNumber(formatDate(TODAY, 'MM'));
        }

        if (/^\d{4}[-\.\/]\d{1,2}[-\.\/](\d{1,2})/.test(endDate)) {
            d = RegExp.$1;
        }
        // 取当月最后一天
        else {
            d = new Date(Date.parse(new Date(y, m)) - ONE_DAY_MSEC).getDate();
        };

        return this.dateToObject(y + '/' + m + '/' + d);
    };

    /**
     * 将日期字符串转换为Date()对象
     * @param date
     */
    fn.dateToObject = function(date) {
        var newDate = '';
        // 年月
        var reg = /(\d{4})[-\/\.](\d{1,2})[-\/\.]?/;
        if (reg.test(date)) {
            newDate += RegExp.$1 + '/' + RegExp.$2;
        };

        // 是否有day日
        if (/[-\/\.]\d{1,2}[-\/\.](\d{1,2})/.test(date)) {
            newDate += '/' + RegExp.$1;
        } else {
            newDate += '/' + '01';
        }

        if (/\d{4}\/\d{1,2}\/\d{1,2}/.test(newDate)) {
            // newDate 为字符串
            return new Date(newDate);
        } else {
            this.opts.error({
                code: 2,
                msg: CODES[2].replace('{{text}}', date)
            })
            return false;
        }

    };

    /**
     * 创建日历
     */
    fn.createCalendar = function() {

        var showPrevBtn = true;
        var showNextBtn = true;

        var thisMonthYM = formatDate(this.month, 'yyyyMM');

        // // 当前系统月份
        // var systemMonth = formatDate(TODAY, 'yyyyMM');
        // 开始日期
        var setStartMonth = formatDate(this.startDate, 'yyyyMM');
        // 系统月份大于等于当前月份时候，不显示上一月按钮
        if (setStartMonth >= thisMonthYM) {
            showPrevBtn = false;
        }

        // 结束月份
        var setEndMonth = formatDate(this.endDate, 'yyyyMM');
        // 当前月大于等于endDate结束日期，则不显示下一月按钮
        if (setEndMonth <= thisMonthYM) {
            showNextBtn = false;
        }

        var html = '';

        // 创建html DOM结构
        html += '<div class="calendar-container">';
        html += ' <div class="calendar-head-wrapper">';

        // 上一月按钮
        if (showPrevBtn)
            html += '       <a class="prev-month" title="上一月">上一月</a>';
        // 标题
        html += '   <div class="calendar-month-title">' + formatDate(this.month, 'yyyy年MM月') + '</div>';
        // 下一月按钮
        if (showNextBtn)
            html += '       <a class="next-month" title="下一月">下一月</a>';

        html += ' </div>';
        html += ' <div class="calendar-table-wrapper">';
        html += '       <table cellpadding="4" cellspacing="0">';
        html += '       <thead><tr class="week"><th class="weekend">日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th class="weekend">六</th></tr></thead>';
        html += '       <tbody>' + this._createTbody() + '</tbody>';
        html += '     </table>';
        html += '    </div>';

        // 是否显示按钮组
        if (!this.opts.hideFooterButton) {
            html += '    <div class="calendar-foot-wrapper">';
            html += '        <button class="btn btn-reset">重置</button>';
            html += '        <button class="btn btn-confirm">确定</button>';
            html += '        <button class="btn btn-cancel">取消</button>';
            html += '    </div>';
        }
        html += '</div>';

        this.calendar.html(html);

        // 渲染数据到表格
        this.renderDataToTalbe();
    };

    /**
     * 创建日历表格(日期部分)
     * @returns {string}
     * @private
     */
    fn._createTbody = function() {

        // 当月天数
        var thisMonthDays = this._getMonthDays();
        //这个月的第一天是星期几
        var firstDayIsWeek = this.month.getDay();
        // 日历中显示日期
        var d = 0;
        // tr 行数
        var rows = Math.ceil((thisMonthDays + firstDayIsWeek) / 7);
        // td id
        var tdId = '';
        var html = '';
        // 设置的开始dete和结束date
        var startDay = formatDate(this.startDate, 'yyyy-MM-dd');
        var endDay = formatDate(this.endDate, 'yyyy-MM-dd');

        // 创建日期表格
        for (var i = 0; i < rows; i++) {

            html += '<tr>';

            for (var k = 1; k <= 7; k++) {

                d = i * 7 + k - firstDayIsWeek;

                if (d > 0 && d <= thisMonthDays) {
                    tdId = formatDate(this.month, 'yyyy-MM-') + formatNumber(d);

                    if (today == tdId) d = '今天';
                    // if (tomorrow == tdId) d = '明天';

                    // 今天（开始日期）与设置的结束日期之间的日期
                    // 为可操作，且显示价格、库存
                    if (tdId >= startDay && tdId <= endDay) {

                        html += '<td class="valid-hook" data-week="' + (k - 1) + '" data-id="' + tdId + '">';
                        html += '    <div>';
                        html += '        <b>' + d + '</b>';
                        html += '        <div class="data-hook"></div>';
                        html += '    </div>';
                        html += '</td>';
                    } else {
                        html += '<td class="disabled"><b>' + d + '</b></td>';
                    }
                } else {
                    html += '<td>&nbsp;</td>';
                }

            } // for k End

            html += '</tr>';
        } // for j End

        return html;
    };


    /**
     * 渲染数据到表格
     */
    fn.renderDataToTalbe = function() {
        var me = this;
        var dayData = null;
        var html = '';
        // 可操作的日期td
        this.calendar.find('.valid-hook').each(function() {
            dayData = me._getDateData($(this).data('id'));
            html = me.dayComplate().toString();
            if (dayData) {
                // console.log(dayData)
                for (var key in dayData) {
                    html = html.replace('{' + key + '}', dayData[key]);
                }
                $(this).data('data', JSON.stringify(dayData)).find('.data-hook').html(html);
            } else {
                $(this).data('data', '{}').find('.data-hook').html('');
            }
        });
    };

    /**
     * 获取day设置数据
     * @param {String} day_id 日期0000-00-00
     */
    fn._getDateData = function(day_id) {
        var val
        for (var i = 0; i < this.data.length; i++) {
            val = this.data[i]
            if (day_id == val.date) {
                return val
            }
        }
        return null;
    };

    /**
     * 获取当前月份最大天数
     * @returns {number} 当月天数
     * @private
     */
    fn._getMonthDays = function() {
        var month = this.month;
        // 第几月
        var y = formatDate(month, 'yyyy');
        var m = formatDate(month, 'MM');
        if (m == 12) {
            return 31;
        } else {
            // month的下个月第一天，减去一天则为该月的最后一天
            return (new Date(Date.parse(new Date(y, m, 1)) - ONE_DAY_MSEC)).getDate();
        }
    };

    /**
     * 日详细设置
     */
    fn.initSettingWindow = function() {

        var html = '';
        html += '<div class="date-detailed-settings">';
        html += '    <div class="cddsw-container">';
        html += '       <div class="bs-content">';
        html += '           <div class="bs-options-wrapper bs-options-daterange">';
        html += '               <span class="bs-lable">日期筛选</span>';
        html += '               <button class="btn-allmonth">全选</button>';
        html += '               <button class="btn-allclear">清除所有</button><br/>';
        html += '               <span class="bs-lable">星期筛选</span>';
        html += '               <label><input name="enableWeekRange" class="checkbox-daterange" type="checkbox" value="1"> 周一</label>';
        html += '               <label><input name="enableWeekRange" class="checkbox-daterange" type="checkbox" value="2"> 周二</label>';
        html += '               <label><input name="enableWeekRange" class="checkbox-daterange" type="checkbox" value="3"> 周三</label>';
        html += '               <label><input name="enableWeekRange" class="checkbox-daterange" type="checkbox" value="4"> 周四</label><br/>';
        html += '               <span class="bs-lable"></span>';
        html += '               <label><input name="enableWeekRange" class="checkbox-daterange" type="checkbox" value="5"> 周五</label>';
        html += '               <label><input name="enableWeekRange" class="checkbox-daterange" type="checkbox" value="6"> 周六</label>';
        html += '               <label><input name="enableWeekRange" class="checkbox-daterange" type="checkbox" value="0"> 周日</label><br/>';
        html += '           </div>';
        html += '       </div>';
        html += '       <div class="cddsw-head-wrapper">';
        html += '           <div class="cddsw-title">';
        html += '               批量修改<span class="cddsw-title-count">0</span>个日期';
        html += '           </div>';
        html += '       </div>';
        html += '       <fieldset class="cddsw-batch-settings clearfix">';
        // html += '           <label class="bs-title"><b>成人</b></label>';
        html += '           <div class="bs-content">';
        html += '               <ul class="cddsw-form-wrapper clearfix">';
        html += '                   <li><label>售价</label><input name="price" class="goods_price" type="number" min="0" placeholder="0"><em class="add-on">元</em></li>';
        html += '                   <li><label>库存</label><input name="stock" type="number" min="0" placeholder="0"><em class="add-on">人</em></li>';
        // html += '                   <li><label>购买上限</label><input name="buyNumMax" type="number" min="0" placeholder="0"><em class="add-on">人</em></li>';
        // html += '                   <li><label>购买下限</label><input name="buyNumMin" type="number" min="0" placeholder="0"><em class="add-on">人</em></li>';
        html += '              </ul>';
        html += '           </div>';
        // html += '           <label class="bs-title"><b>儿童</b></label>';
        // html += '           <div class="bs-content">';
        // html += '               <ul class="cddsw-form-wrapper clearfix">';
        // html += '                   <li><label>售价</label><input name="childPrice" class="goods_price" type="number" min="0" placeholder="0"><em class="add-on">元</em></li>';
        // html += '              </ul>';
        // html += '           </div>';
        html += '       </fieldset>';
        html += '       <span class="error-msg"></span>';
        html += '       <div class="cddsw-foot-wrapper">';
        html += '           <button class="btn-save">保存</button>';
        html += '           <button class="btn-cancel">删除</button>';
        html += '           <button class="btn-save btn-year">全年</button>';
        html += '       </div>';
        html += '    </div>';
        html += '</div>';

        this.settingWindow.html(html);
    };

    /**
     * 创建单日设置input组
     * @returns {string}
     * @private
     */
    fn._createDaySetupInputGroup = function() {
        var html = '';
        var config = this.opts.config;
        for (var i = 0; i < config.length; i++) {
            var val = config[i];
            html += '<li>';
            html += '   <label>' + val.name + '</label>';
            html += '   <input name="' + val.key + '" type="text">';
            html += '</li>';
        }
        return html;
    };

    /**
     * 创建日期显示模板
     * @returns {string}
     * @private
     */
    fn.dayComplate = function() {
        var arr = this.opts.show;
        var html = '<label class="title">销售详细</label>';
        if (arr && arr instanceof Array) {
            for (var i = 0; i < arr.length; i++) {
                var val = arr[i];
                if (val.key == 'buyNumMax') {
                    break;
                } else {
                    html += '<p>' + val.name + '{' + val.key + '}</p>';
                }
            }
            // html += '<p>买上下限：{buyNumMax} / {buyNumMin}</p>';
        }
        return html;
    };

    /**
     * 按钮点击事件处理
     */
    fn.handleCalendarClickEvent = function() {

        var me = this;

        // ** 日历容器内按钮点击事件 *******************************************

        // 上一月
        $('#calendarPrice .prev-month').on('click',function() {
            me._prevMonth();
            me._clearAll();
        });

        // 下一月
        $('#calendarPrice .next-month').on('click',function() {
            me._nextMonth();
            me._clearAll();
        });

        // 获取点击日期数据
        // 渲染设置框内容
        // 显示设置窗口
        $('#calendarPrice .valid-hook').on('click',function() {
            // 当前日的数据
            var goodData = $(this).data('data');

            try {
                goodData = JSON.parse(goodData);
            } catch (e) {
                goodData = {};
            }

            // 拦截弹出设置窗口，返回当天数据
            if (me.opts.everyday) {
                me.opts.everyday(goodData);
                return;
            }

            // 用户传入字段
            $.each(goodData, function(key, val) {
                me.settingWindow.find('[name="' + key + '"]').val(val);
            });

            // 设置选中状态
            if ($(this).hasClass('selectedDate')) {
                $(this).removeClass('selectedDate');
            } else {
                $(this).addClass('selectedDate');
            }

            // 栏目标题
            me.settingWindow.find('.cddsw-title-count').html($('.selectedDate').length);
        });
    };

   /**
     * 按钮点击事件处理
     */
    fn.handleClickEvent = function() {

        var me = this;
        // ** 设置按钮点击事件 *******************************************
        // SKU选择
        $('#calendarSkuList li').on('click',function() {
            $('#calendarSkuList li.selected').removeClass('selected');
            $(this).addClass('selected');
            // 产品库存信息
            me.opts.data = me.opts.getData();
            me.data = me._getOptionsData();
            // 渲染数据到表格
            me.renderDataToTalbe();
            me._clearAll();
        });
        // 全月选择
        $('#calendarPriceSetting .btn-allmonth').on('click',function() {
            $('.valid-hook').each(function() {
                if (!$(this).hasClass('selectedDate')) {
                    $(this).addClass('selectedDate');
                }
            });
            // 星期全选
            me.settingWindow.find('[name="enableWeekRange"]').prop('checked', true);
            // 栏目标题
            me.settingWindow.find('.cddsw-title-count').html($('.selectedDate').length);
        });

        // 清除选中
        $('#calendarPriceSetting .btn-allclear').on('click',function() {
            me._clearAll();
        });

        // 日期帅选
        $('#calendarPriceSetting .checkbox-daterange').on('click',function() {
            // 星期checkbox
            var dateRangeCheckbox = $(this);

            $('.valid-hook').each(function() {

                var thisWeek = $(this).data('week');
                // 设置选中状态
                if (dateRangeCheckbox.val() == thisWeek) {
                    if (dateRangeCheckbox.is(':checked')) {
                        if (!$(this).hasClass('selectedDate')) {
                            $(this).addClass('selectedDate');
                        }
                    } else {
                        $(this).removeClass('selectedDate');
                    }
                }
            });
            // 栏目标题
            me.settingWindow.find('.cddsw-title-count').html($('.selectedDate').length);
        });

        // 删除设置
        $('#calendarPriceSetting .btn-cancel').on('click',function() {
            // 防止内存溢出等待
            sleep(500);

            // 设置的日期范围数组
            var deleteDateRangeArr = [];
            $('.valid-hook').each(function() {
                // 选中
                if ($(this).hasClass('selectedDate')) {
                    deleteDateRangeArr.push(formatDate(me.dateToObject($(this).data('id')), 'yyyy-MM-dd'));
                }
            });
            if (deleteDateRangeArr.length > 0) {
                me.deleteThisData(deleteDateRangeArr);
                me._clearAll();
            } else {
                me.opts.error({
                    code: 3,
                    msg: CODES[3]
                });
            }
        });

        // 保存设置
        $('#calendarPriceSetting .btn-save').on('click',function() {
            // 防止内存溢出等待
            sleep(500);

            // 日历容器
            var $dateSetWrapper = $(this).closest('.cddsw-container');
            // 修改的数据
            var setData = {};
            var errorFlg = false;
            $dateSetWrapper.find('.cddsw-form-wrapper [name]').each(function() {
                var key = $(this).attr('name');
                var val = $(this).val();
                if (val == '') {
                    errorFlg = true;
                    me.opts.error({
                        code: 10,
                        msg: CODES[10]
                    });
                }
                setData[key] = val;
            });

            // 校验错误
            if (errorFlg) {
                return;
            }

            // 设置的日期范围数组
            var setDateRangeArr = [];

            // 是否全年
            if ($(this).hasClass('btn-year')) {
                var setWeekRangeArr = [];
                var deleteDateRangeArr = [];
                $('[name="enableWeekRange"]').each(function() {
                    if ($(this).is(':checked')) {
                        setWeekRangeArr.push(Number($(this).val()));
                    }
                });

                if (setWeekRangeArr.length > 0) {
                    var y = toNumber(formatDate(me.month, 'yyyy'));
                    var toYear = formatDate(me.dateToObject((y + 1) + '-01-01'), 'yyyy-MM-dd');
                    var tempDay = today;
                    do {
                        var dateObj = me.dateToObject(tempDay);
                        if (setWeekRangeArr.indexOf(dateObj.getDay()) > -1) {
                            setDateRangeArr.push(tempDay);
                        } else {
                            deleteDateRangeArr.push(tempDay);
                        }
                        tempDay = formatDate(new Date(dateObj.getTime() + ONE_DAY_MSEC), 'yyyy-MM-dd');
                    } while (tempDay < toYear);

                    if (deleteDateRangeArr.length > 0) {
                        // 未被选中的星期删除
                        me.deleteThisData(deleteDateRangeArr);
                    }
                } else {
                    me.opts.error({
                        code: 11,
                        msg: CODES[11]
                    });
                    return;
                }
            } else {
                $('.valid-hook').each(function() {
                    // 选中
                    if ($(this).hasClass('selectedDate')) {
                        setDateRangeArr.push(formatDate(me.dateToObject($(this).data('id')), 'yyyy-MM-dd'));
                    }
                });
            }

            if (setDateRangeArr.length > 0) {
                me.handleThisData(setData, setDateRangeArr);
                me._clearAll();
            } else {
                me.opts.error({
                    code: 3,
                    msg: CODES[3]
                });
            }
        });
    };

    // 计算出开始日期至结束日期间的date[0000-00-00]
    fn._createDateRangeArr = function(sd, ed) {
        var dates = [];

        var sdMsec = Date.parse(this.dateToObject(sd));
        var edMsec = Date.parse(this.dateToObject(ed));
        var days = Math.floor((edMsec - sdMsec) / ONE_DAY_MSEC) + 1;

        for (var i = 0; i < days; i++) {
            var date = new Date(sdMsec + ONE_DAY_MSEC * i);
            dates.push(formatDate(date, 'yyyy-MM-dd'));
        }
        return dates;
    }

    /**
     * 处理设置的数据，并更新this.data
     * @param obj 设置的数据
     * @param dateArr
     */
    fn.handleThisData = function(setData, dateArr) {

        var arr = dateArr || [];

        for (var i = 0; i < arr.length; i++) {
            // 更新this.data
            this._updateThisData(setData, arr[i]);
        }

        // 更新this.data
        this.opts.save(setData, arr);

        // 处理新生成的数据
        this.data = this.sort(this.rmRepeat(this.data, 'date'));

        // 渲染数据到表格
        this.renderDataToTalbe();
    };

    // 更新或现在this.data数据
    fn._updateThisData = function(setData, dateString) {
        var me = this;

        // this.data中是否含有dateString的数据
        var is_existence = false;

        var data = {
            date: dateString
        };

        // 获取设置的参数及其值
        $.each(setData, function(key, val) {
            if (key != 'date') {
                data[key] = val;
            }
        });

        $.each(this.data, function(key, val) {
            if (data.date === val.date) {
                is_existence = true;
                me.data[key] = data;
                return false;
            }
        });

        if (!is_existence) {
            this.data.push(data);
        }
    };

    /**
     * 处理设置的数据，并删除this.data
     * @param obj 设置的数据
     * @param dateArr
     */
    fn.deleteThisData = function(dateArr) {

        var arr = dateArr || [];

        for (var i = 0; i < arr.length; i++) {
            // 更新this.data
            this._deleteThisData(arr[i]);
        }

        // 刪除this.data
        this.opts.delete(arr);

        // 处理新生成的数据
        this.data = this.sort(this.rmRepeat(this.data, 'date'));

        // 渲染数据到表格
        this.renderDataToTalbe();
    };

    // 删除或现在this.data数据
    fn._deleteThisData = function(dateString) {

        for (var i = this.data.length - 1; i >= 0; i--) {
            if (dateString === this.data[i].date) {
                this.data.splice(i, 1);
                return false;
            }
        }
    };

    /**
     * 获取初始this.data配置
     * 获取初始数据中大于开始日期的数据
     * 去重复、排序
     * @returns {Array}
     * @private
     */
    fn._getOptionsData = function() {
        // 获取开始日期
        var startDay = formatDate(this.startDate, 'yyyy-MM-dd');
        var endDay = formatDate(this.endDate, 'yyyy-MM-dd');
        // 新空数组，用于存放筛选出来的数据
        var arr = [];

        $.each(this.opts.data, function(key, val) {
            if (val.date >= startDay && val.date <= endDay) {
                arr.push(val);
            }
        })

        // 去重复、排序操作
        return this.sort(this.rmRepeat(arr, 'date'));
    };

    /**
     * asc 按升序排列 desc 按降序排列
     * @param arr 需要排序的数组
     * @return {*}
     */
    fn.sort = function(arr) {

        if (!(arr instanceof Array)) {
            this.opts.error({
                code: 8,
                msg: CODES[8]
            });
            return arr;
        }

        if (arr.length < 1) {
            return arr;
        }

        var minIndex = 0;
        var fontObj = null;

        for (var i = 0; i < arr.length; i++) {
            minIndex = i;
            for (var j = i + 1; j < arr.length; j++) {
                if (arr[j].date < arr[minIndex].date) {
                    minIndex = j;
                    fontObj = arr[i];
                    arr.splice(i, 1, arr[j]);
                    arr.splice(j, 1, fontObj);
                }
            }
        }

        return arr;

    };

    /**
     * 数组去掉重复元素
     * @param {Array} arr
     * @param {String} key
     */
    fn.rmRepeat = function(arr, key) {
        var hash = {};
        var newArr = [];

        for (var i = 0; i < arr.length; i++) {
            var val = arr[i];
            // 数组元素为对象
            if (key) {
                try {
                    val = arr[i][key];
                } catch (e) {}
            }

            if (hash[val]) {
                continue;
            }
            newArr.push(arr[i]);
            hash[val] = true;
        }

        return newArr;
    };

    // 获取当前月数据
    fn.getMonthData = function() {
        var mstr = formatDate(this.month, 'yyyy-MM')
        var reg = new RegExp('^' + mstr + '-\\d+')
        var i, val
        var arr = []
        for (i = 0; i < this.data.length; i++) {
            val = this.data[i]
            if (reg.test(val.date)) {
                // console.log(val)
                arr.push(val)
            }
        }
        return {
            month: mstr,
            data: arr
        }
    }

    // 更新数据
    fn.update = function(newArr) {
        if (!newArr || !(newArr instanceof Array)) {
            this.opts.error({
                code: 9,
                msg: CODES[9]
            })
            return
        }
        var i, val, data, index
        data = this.rmRepeat(newArr, 'date')
        for (i = 0; i < data.length; i++) {
            val = data[i]
            val.stock *= 10
            // console.log(val)
            index = this._getArrIndex(val, this.data)
            if (index === null) {
                this.data.push(val)
            } else {
                this.data.splice(index, 1, val)
            }
        }
        this.renderDataToTalbe()
    }

    // 获取元素在数组中的索引值
    fn._getArrIndex = function(item, arr) {
        for (var i = 0; i < arr.length; i++) {
            if (item.date == arr[i].date) {
                return i
            }
        }
        return null
    }

    $.extend({
        CalendarPrice: function(opts) {
            return new CalendarPrice(opts);
        }
    });

})(jQuery);