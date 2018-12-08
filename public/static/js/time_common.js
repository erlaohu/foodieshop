/**
 * 事件处理类
 */
//时间戳转时间类型
function timeStampTurnTime(timeStamp){
	if(timeStamp > 0){
		var date = new Date();  
		date.setTime(timeStamp * 1000);  
		var y = date.getFullYear();      
		var m = date.getMonth() + 1;      
		m = m < 10 ? ('0' + m) : m;      
		var d = date.getDate();      
		d = d < 10 ? ('0' + d) : d;      
		var h = date.getHours();    
		h = h < 10 ? ('0' + h) : h;    
		var minute = date.getMinutes();    
		var second = date.getSeconds();    
		minute = minute < 10 ? ('0' + minute) : minute;      
		second = second < 10 ? ('0' + second) : second;     
		return y + '-' + m + '-' + d+' '+h+':'+minute+':'+second;  		
	}else{
		return "";
	}
	    
	//return new Date(parseInt(time_stamp) * 1000).toLocaleString().replace(/年|月/g, "/").replace(/日/g, " ");
}

/**
 * 日期格式化
 * @param date 日期对象 new Date()
 * @param fmt format 输出日期格式 yyyy-MM-dd hh:mm:ss
 */
function formatDate (date, fmt) {
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
}

/**
 * 数字格式化
 * @param n number
 */
function formatNumber (n) {
    n = n.toString();
    return n[1] ? n : '0' + n;
};