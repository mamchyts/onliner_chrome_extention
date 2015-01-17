/**
 * OnLoad function
 * 
 * @return void
 */
window.onload = function(){

    bg_wnd = chrome.extension.getBackgroundPage();
    form = document.getElementById('popup_login_form');

    // set some events handlers
    document.getElementById('popup_save_btn').onclick = function(obj){
        // fade popup
        document.getElementById('loader').style.display = 'block';

        if(form.elements && form.elements.length){
            var data = {};
            data.usd = form.elements[0].value;
            data.eur  = form.elements[1].value;
            data.rus  = form.elements[2].value;

            setTimeout(function(){
                bg_wnd.bg.updateCurrencies(data);
                bg_wnd.bg.changePrices();
                bg_wnd.bg.reloadPage();

                // hide fade on popup
                document.getElementById('loader').style.display = 'none';
            }, 200);
        }
        return false;
    };

    var currencies = bg_wnd.bg.getCurrencies();
    form.elements[0].value = currencies.usd;
    form.elements[1].value = currencies.eur;
    form.elements[2].value = currencies.rub;
}