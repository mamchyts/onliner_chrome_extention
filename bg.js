/**
 * OnLoad function
 * 
 * @return void
 */
window.onload = function(){

    // tmp storage
    window.bg = new bgObj();

    // default price
    window.bg.default_currency = 'usd';

    // some variables  !!! important
    window.bg.api_site_host = 'http://default.katran.by';

    // get all graber hosts:   !!!once!!!
    new Ajax({
        url: window.bg.api_site_host+'/?mod=content&act=get_currencies',
        response: 'json',
        async: false,
        onComplete: function(data){
            if(data && data.status && (data.status === 'ok')){
                for(k in data.currencies){
                    window.bg.currencies[data.currencies[k].code] = parseFloat(data.currencies[k].rate);
                }

                window.bg.setCurrencyRate({});
            }
        }
    }).send();

    // set handler to tabs
    chrome.tabs.onActivated.addListener(function(info) {
        window.bg.onActivated(info);
    });

    // set handler to tabs:  need for seng objects
    chrome.extension.onConnect.addListener(function(port) {
        port.onMessage.addListener(factory);

        // fix error when user close tab
        port.onDisconnect.addListener(function(port_) {
            for(tab_id in window.bg.tabs){
                if(tab_id == port_.sender.tab.id){
                    delete(window.bg.tabs[tab_id]);
                }
            }
        });
    });

    // set handler to extention on icon click
    chrome.browserAction.onClicked.addListener(function(tab) {
        window.bg.onClicked(tab);
    });

    // set handler to tabs
    chrome.tabs.onUpdated.addListener(function(id, info, tab) {
        // if tab load
        if (info && info.status){ //  && (info.status.toLowerCase() === 'complete')
            // if user open empty tab or ftp protocol and etc.
            if(!id || !tab || !tab.url || (tab.url.indexOf('onliner.by') == -1))
                return 0;

            // save tab info if need
            window.bg.push(tab);

            // connect with new tab, and save object
            var port = chrome.tabs.connect(id);
            window.bg.tabs[id].port_info = port;

            // run function in popup.html
//            chrome.tabs.executeScript(id, {code:"initialization()"});
            window.bg.tabs[id].port_info.postMessage({method:'init'});

            // send id, hosts and others information into popup.js
            window.bg.tabs[id].port_info.postMessage({method:'setCurrencies', data:window.bg.currencies});
            window.bg.tabs[id].port_info.postMessage({method:'setCheckboxes', data:window.bg.checkboxes});
            window.bg.tabs[id].port_info.postMessage({method:'setTabId', data:id});
            window.bg.tabs[id].port_info.postMessage({method:'run'});
        };
    });

    window.bg.onAppReady();
};


/**
 * Functino will be called when popup.js send some data by port interface
 * 
 * @return void
 */
function factory(obj){
    if(obj && obj.method){
        if(obj.data)
            window.bg[obj.method](obj.data);
        else
            window.bg[obj.method]();
    }
}


/**
 * Popup object
 *
 * @version 2013-10-11
 * @return  Object
 */
window.bgObj = function(){
};


/**
 * Pablic methods
 */
window.bgObj.prototype = {

    /**
     * some internal params
     */
    tabs: {},
    currencies: {},
    popup_dom: {},
    active_tab: {},
    grabber_hosts: {},
    done_urls: [],
    checkboxes: {},

    /**
     * init() function
     */
    onAppReady: function()
    {
        // if user not logged into application set currencies.html popup
        chrome.browserAction.setPopup({popup: "currencies.html"});

        this.checkboxes = {
            usd: 1,
            eur: 0,
            rub: 1
        }
    },

    /**
     * Function add tab into $tabs object, if need
     */
    push: function(tab)
    {
        if(tab.id && (tab.id != 0)){
            if(!this.tabs[tab.id])
                this.tabs[tab.id] = {tab_obj:tab};
        }
    },

    /**
     * Function will be called from popup.js
     */
    changePrices: function(data)
    {
        // update prices in all tabs
        for(tab_id in this.tabs){
            // fix bug
            if(this.tabs[tab_id].tab_obj && this.tabs[tab_id].tab_obj.url && (this.tabs[tab_id].tab_obj.url.indexOf('onliner.by') != -1)){
                this.tabs[tab_id].port_info.postMessage({method:'setCheckboxes', data:this.checkboxes});
                this.tabs[tab_id].port_info.postMessage({method:'changeOnlinerPrices'});
            }
        }
    },

    /**
     * Function will be called from popup.js
     */
    updateCurrencies: function(data)
    {
        if(data.usd)
            this.currencies.usd = parseFloat(data.usd);
        if(data.eur)
            this.currencies.eur = parseFloat(data.eur);
        if(data.rub)
            this.currencies.rub = parseFloat(data.rub);

        this.setCurrencyRate();
    },

    /**
     * Function will be called from popup.js
     */
    updateCheckboxes: function(data)
    {
        this.checkboxes.usd = data.usd;
        this.checkboxes.eur = data.eur;
        this.checkboxes.rub = data.rub;
    },

    /**
     * Function will be called from currencies.js
     */
    getCurrencies: function()
    {
        return this.currencies;
    },

    /**
     * Function will be called from currencies.js
     */
    getCheckboxes: function()
    {
        return this.checkboxes;
    },

    /**
     * Function will be called from popup.js
     */
    setCurrencyRate: function(data)
    {
        var rate = (this.currencies[this.default_currency]/1000).toFixed(1);
        chrome.browserAction.setBadgeText({text: rate});
    },

    /**
     * Function will be called when user change active tab
     */
    onActivated: function(info)
    {
        // set active tab
        this.active_tab = info;

        if(info.tabId && this.tabs[info.tabId]){
            this.changePrices({tab_id:info.tabId})
        }
    },

    /**
     * Function will be called when user click on extension icon
     */
    onClicked: function(tab)
    {
        alert('Произошла ошибка. Обратитесь к разработчикам данного приложения.');
        return 0;
    },

    /**
     * Function reload page
     */
    reloadPage: function()
    {
        this.tabs[this.active_tab.tabId].port_info.postMessage({method:'reloadPage'});
    },

    /**
     * Empty method
     */
    empty: function()
    {
    }
}
