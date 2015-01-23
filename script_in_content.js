// set handler to tabs:  need for seng objects to backgroung.js
chrome.extension.onConnect.addListener(function(port){
    port.onMessage.addListener(factory);
});


/**
 * Function remove spaces in begin and end of string
 *
 * @version 2012-11-05
 * @param   string  str
 * @return  string
 */
function trim(str)
{
    return String(str).replace(/^\s+|\s+$/g, '');
}


/**
 * Function return element by id
 *
 * @version 2012-07-22
 * @param   string   id    title of id
 * @return  Object
 */
function $(id)
{
    return document.getElementById(id);
}


/**
 * Function return element by class name
 *
 * @version 2012-11-07
 * @param   string   classList
 * @param   object   node
 * @return  Object
 */
function $$(classList, node)
{
    if(document.getElementsByClassName)
        return (node || document).getElementsByClassName(classList);
    else{
        var node = node || document,
        list = node.getElementsByTagName('*'), 
        length = list.length,  
        classArray = classList.split(/\s+/), 
        classes = classArray.length, 
        result = [], i,j;

        for(i = 0; i < length; i++) {
            for(j = 0; j < classes; j++)  {
                if(list[i].className.search('\\b' + classArray[j] + '\\b') != -1) {
                    result.push(list[i])
                    break
                }
            }
        }

        return result;
    }
}


/**
 * Functino will be called from background.js
 * 
 * @return void
 */
function initialization(){
    window.popup = new popupObj();
}


/**
 * Functino will be called when background.js send some data by port interface
 * 
 * @return void
 */
function factory(obj){
    if(obj && obj.method){
        if(obj.method == 'init'){
            window.popup = new popupObj();
            return 0;
        }

        if(obj.data)
            window.popup[obj.method](obj.data);
        else
            window.popup[obj.method]();
    }
}


/**
 * Popup object
 *
 * @version 2013-10-11
 * @return  Object
 */
window.popupObj = function(){
};


/**
 * Pablic methods
 */
window.popupObj.prototype = {

    /**
     * some internal params
     */
    currencies: null,
    tab_id: null,
    port: null,
    interval: null,

    /**
     * Function will be called from bg.js
     */
    setCurrencies: function(currencies)
    {
        this.currencies = currencies;
    },

    /**
     * Function will be called from bg.js
     */
    setTabId: function(id)
    {
        this.tab_id = id;
    },

    /**
     * Function will be called from bg.js
     */
    getTabId: function()
    {
        return this.tab_id;
    },

    /**
     * Function check total host
     */
    run: function()
    {
        // get total host
        if(document.location.host && (document.location.host != ''))
            this.total_host = document.location.host;
        else if(document.location.hostname && (document.location.hostname != ''))
            this.total_host = document.location.hostname;

        if(!this.total_host || (this.total_host === ''))
            return 0;

        if(this.total_host.indexOf('onliner.by') == -1)
            return 0;

        // create connection to bg.js and send request
        this.port = chrome.extension.connect();
        this.port.postMessage({method:'changePrices', data:{tab_id:this.tab_id}});
    },

    /**
     * Function will be called from bg.js
     * Parse page
     */
    changeOnlinerPrices: function()
    {
        // infinity func
        if(!window.popup.interval){
            window.popup.interval = setInterval(function() {
                window.popup.changeOnlinerPrices();
            }, 500);
        }

        if((this.total_host.indexOf('ab.onliner.by') != -1) || (this.total_host.indexOf('mb.onliner.by') != -1)){
            this.abPrices();
        }
        else if((this.total_host.indexOf('baraholka.onliner.by') != -1)){
            this.baraholkaPrices();
        }
        else if((this.total_host.indexOf('r.onliner.by') != -1)){
            this.rentPrices();
        }
    },

    /**
     * change prices
     */
    abPrices: function()
    {
        var table = false;
        if($$('grid-autoba') && $$('adverts-table', $$('grid-autoba')[0]))
            table = $$('adverts-table', $$('grid-autoba')[0])[0];

        if($$('autoba-hd-details-costs').length && ($$('updatedPrice').length == 0) ){
            var price = $$('autoba-hd-details-costs')[0].children[0].children[0];
            var by_price = price.innerHTML.replace(/[\s]/ig, '');

            // compile prices
            var prices = this.compilePrices(by_price);

            var html = '';
            var html2 = '';
            for(k in prices){
                html += '<span class="autoba-hd-details-costs updatedPrice" style="margin-left:20px"><span class="cost"><strong>'+trim(prices[k])+'</strong></span></span><strong class="c-torg">'+k.toUpperCase()+'</strong>';
                html2 += '<div class="autoba-hd-details"><span class="autoba-hd-details-costs"><span class="cost"><strong>'+trim(prices[k])+'</strong></span></span><strong class="c-torg">'+k.toUpperCase()+'</strong></div>';
            }

            price.parentNode.parentNode.parentNode.innerHTML += html;
            $('autoba-contacts-content').parentNode.innerHTML += html2
        }
        else if( (($$('carRow', table).length != 0) || ($$('motoRow', table).length != 0)) && ($$('updatedPrice', table).length == 0)){
            var rows = [];
            if($$('carRow', table).length)
                rows = $$('carRow', table);
            else if($$('motoRow', table).length)
                rows = $$('motoRow', table);

            for(var i = 0, len = rows.length; i < len; ++i){
                if(!$$('cost-i', rows[i])[0]
                    || !$$('cost-i', rows[i])[0].children[0]
                    || !$$('cost-i', rows[i])[0].children[0].children[0]
                    || !$$('cost-i', rows[i])[0].children[0].children[0].children[0] ){
                    continue;
                }

                    // add helper class
                if(rows[i].className.indexOf('updatedPrice') != -1)
                    continue;
                else
                    rows[i].className += ' updatedPrice';

                var price = $$('cost-i', rows[i])[0].children[0].children[0].children[0];
                var by_price = price.innerHTML.replace(/[\s]/ig, '');

                var prices = this.compilePrices(by_price);

                var link = price.parentNode.href;
                var html = '<p style="height: 0px;">&nbsp;</p>';
                for(k in prices){
                    html += '<p class="big"><a href="'+link+'"><strong style="font-size: 13px;">'+trim(prices[k])+' <span style="color: #f00">'+k.toUpperCase()+'</span></strong></a></p>';
                }

                price.parentNode.parentNode.parentNode.innerHTML += html;
            }
        }
    },

    /**
     * compilePrices method
     */
    compilePrices: function(by_price)
    {
        if(!by_price)
            by_price = 0

        var prices = {
            usd: Math.round(by_price/this.currencies.usd).toString(),
            eur: Math.round(by_price/this.currencies.eur).toString(),
            rub: Math.round(by_price/this.currencies.rub).toString()
        }

        for(k in prices){
            if(prices[k].length == 4){
                prices[k] = prices[k].substr(0, 1)+' '+prices[k].substr(1, 3);
            }
            else if(prices[k].length == 5){
                prices[k] = prices[k].substr(0, 2)+' '+prices[k].substr(2, 3);
            }
            else if(prices[k].length == 6){
                prices[k] = prices[k].substr(0, 3)+' '+prices[k].substr(3, 3);
            }
            else if(prices[k].length == 7){
                prices[k] = prices[k].substr(0, 1)+' '+prices[k].substr(1, 3)+' '+prices[k].substr(4, 3);
            }
            else if(prices[k].length == 8){
                prices[k] = prices[k].substr(0, 2)+' '+prices[k].substr(2, 3)+' '+prices[k].substr(5, 3);
            }
            else if(prices[k].length == 9){
                prices[k] = prices[k].substr(0, 3)+' '+prices[k].substr(3, 3)+' '+prices[k].substr(6, 3);
            }
        }

        return prices;
    },

    /**
     * change prices
     */
    baraholkaPrices: function()
    {
        var table = false;
        if($$('ba-tbl-list__table').length)
            table = $$('ba-tbl-list__table')[0];

        var ul_obj = false;
        if($$('b-ba-topicdet').length)
            ul_obj = $$('b-ba-topicdet')[0];

        // if alredy done
        if((!table || table.className.indexOf('updatedPrice') != -1) && (!ul_obj || $$('updatedPrice').length))
            return 0;

        if( ul_obj && ul_obj.children && ul_obj.children[0]){
            var price = ul_obj.children[0];
            var by_price = parseInt(price.textContent.replace(/[\s]/ig, ''));

            // compile prices
            var prices = this.compilePrices(by_price);

            var html_ = '';
            for(k in prices){
                html_ += '<li class="cost">'+trim(prices[k])+'</li><li class="torg" style="margin-right: 20px;">'+k.toUpperCase()+'</li>';
            }

            var pre_html = '<ul class="b-ba-topicdet updatedPrice">'+html_+'</ul>'
            price.parentNode.parentNode.innerHTML += pre_html;
        }
        else if( $$('cost', table).length != 0 ){
            var rows = [];
            rows = $$('cost', table);

            for(var i = 0, len = rows.length; i < len; ++i){
                if(!rows[i].children.length){
                    continue;
                }

                if(!rows[i].children[0].children || !rows[i].children[0].children[0])
                    continue;

                var price = rows[i].children[0].children[0];
                var by_price = price.innerHTML.replace(/[\s]/ig, '');

                var prices = this.compilePrices(by_price);

                var html = '';
                for(k in prices){
                    html += '<p><big><strong>'+trim(prices[k])+'</strong> <span style="color: #f00">'+k.toUpperCase()+'</span></big></p>';
                }

                price.parentNode.parentNode.innerHTML += html;
                table.className += ' updatedPrice';
            }
        }
    },

    /**
     * change prices
     */
    rentPrices: function()
    {
        if(($$('arenda-main__box').length == 0) && ($$('apartment-bar__inner').length == 0))
            return 0;

        var rows_list = $$('classified__figure');
        var rows_view = $$('apartment-bar__inner');
        var rows_done = $$('updatedPrice');

        if( rows_view.length && (rows_view.length != rows_done.length)){
            var price = $$('apartment-bar__value_key')[0];
            var by_price = parseInt(price.textContent.replace(/[\s]/ig, ''));

            // compile prices
            var prices = this.compilePrices(by_price);

            var html = '';
            for(k in prices){
                margin_right = 4;
                if(k == 'rub')
                    margin_right = 0;

                html += '<div class="apartment-bar__item apartment-bar__item_price" style="margin-right: '+margin_right+'px;"><div class="apartment-bar__value apartment-bar__value_key">'+trim(prices[k])+'</div><div class="apartment-bar__value">'+k.toUpperCase()+'</div></div>';
            }

            var newItem = document.createElement("span");
            newItem.innerHTML = html;
            price.parentNode.parentNode.insertBefore(newItem, price.parentNode.parentNode.children[1]);

            rows_view[0].className += ' updatedPrice'
        }
        else if( rows_list.length && (rows_list.length != rows_done.length)){
            var rows = [];
            rows = rows_list;

            for(var i = 0, len = rows.length; i < len; ++i){
                if(!rows[i].children.length || (rows[i].className.indexOf('updatedPrice') != -1)){
                    continue;
                }

                if(!rows[i].children[0].children || !rows[i].children[0].children[0])
                    continue;

                var spec_price = false;
                var price = rows[i].children[0].children[0];

                // fix bug
                if(trim(price.textContent).indexOf('руб') != -1){
                    price = rows[i].children[0].textContent;
                    spec_price = true;
                }

                // prices on MAP
                if(spec_price){
                    var by_price = parseInt(price.replace(/[\s]/ig, ''));
                }
                else
                    var by_price = price.innerHTML.replace(/[\s]/ig, '');

                var prices = this.compilePrices(by_price);

                var html = '<div style="position: absolute; float: right; display: block; top: -105px; right: 5px; background: #fd2; padding: 5px 0px 5px 10px">'+trim(prices.usd)+' <span style="background: #fd8e01; padding: 3px 5px">USD</span></div>';
                rows[i].children[0].innerHTML += html;
                rows[i].className += ' updatedPrice';
            }
        }
    },

    /**
     * Function reload page
     */
    reloadPage: function()
    {
        window.location.reload();
    },

    /**
     * Empty method
     */
    empty: function()
    {
    }
}
