function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }

document.getElementById('submit').addEventListener('click', () => {
    let user = document.getElementById('user');
    let pass = document.getElementById('pass');
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            setCookie('gtid', this.responseText, 7);
        } else {
            location.reload();
        }
    };
    xhttp.open("POST", "/api/login");
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(`user=${user.value}&pass=${pass.value}`);
});