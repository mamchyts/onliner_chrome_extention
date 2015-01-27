/**
 * OnLoad function
 * 
 * @return void
 */
window.onload = function()
{
    bg_wnd = chrome.extension.getBackgroundPage();
    form = document.getElementById('popup_login_form');

    // set some events handlers
    document.getElementById('popup_save_btn').onclick = function(obj){
        // fade popup
        document.getElementById('loader').style.display = 'block';

        if(form.elements && form.elements.length){
            var data = {};
            data.usd = form.elements[0].value;
            data.eur = form.elements[2].value;
            data.rub = form.elements[4].value;

            var checkboxes = {};
            checkboxes.usd = (form.elements[1].checked)?1:0;
            checkboxes.eur = (form.elements[3].checked)?1:0;
            checkboxes.rub = (form.elements[5].checked)?1:0;

            // one currency is requied
            if(!checkboxes.usd && !checkboxes.eur && !checkboxes.rub)
                checkboxes.usd = 1;

            setTimeout(function(){
                bg_wnd.bg.updateCheckboxes(checkboxes);
                bg_wnd.bg.updateCurrencies(data);
                //bg_wnd.bg.changePrices();
                bg_wnd.bg.reloadPage();

                // hide fade on popup
                document.getElementById('loader').style.display = 'none';
            }, 200);
        }
        return false;
    };

    // get actual prices
    updatePrices()

    // infinity func
    if(!window.update_interval){
        window.update_interval = setInterval(function() {
            updatePrices()
        }, 1000000); // every 1000 sec
    }
}


/**
 * updatePrices
 * @return void
 */
function updatePrices()
{
    bg_wnd = chrome.extension.getBackgroundPage();

    var currencies = bg_wnd.bg.getCurrencies();
    form.elements[0].value = currencies.usd;
    form.elements[2].value = currencies.eur;
    form.elements[4].value = currencies.rub;

    var checkboxes = bg_wnd.bg.getCheckboxes();
    form.elements[1].checked = (checkboxes.usd == 1)?true:false;
    form.elements[3].checked = (checkboxes.eur == 1)?true:false;
    form.elements[5].checked = (checkboxes.rub == 1)?true:false;
}
