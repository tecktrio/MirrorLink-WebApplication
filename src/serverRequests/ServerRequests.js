// Request URL s and other Main urls for the application to communicate with server

const IS_REMOTE_SERVER = false

let SERVER_URL;
let SERVER_WEBSOCKET_URL;
const SERVER_ROOT_REMOTE_URL = "https://mirrorlinkserver.developingkerala.com/"
const SERVER_ROOT_LOCAL_URL = "http://127.0.0.1:8000/"
// const CONTROLLER_HTTP_URL = "https://mirrorlinkserver.developingkerala.com/AdministratorLogin"
const CONTROLLER_WEBSOCKET_REMOTE_URL = "wss://mirrorlinkserver.developingkerala.com/ws/controller?"
const CONTROLLER_WEBSOCKET_LOCAL_URL = "ws://127.0.0.1:8000/controller?"

if (IS_REMOTE_SERVER) {
    SERVER_URL = SERVER_ROOT_REMOTE_URL
    SERVER_WEBSOCKET_URL = CONTROLLER_WEBSOCKET_REMOTE_URL
}
else {
    SERVER_URL = SERVER_ROOT_LOCAL_URL
    SERVER_WEBSOCKET_URL = CONTROLLER_WEBSOCKET_LOCAL_URL
}
let socket;
const ADMINISTRATOR_ROOT_URL = SERVER_URL + 'Administrator'


// call this funtion as a promise by passing only the username and password
// return true if login in
// save the ws key in cookie
function MAKE_LOGIN(username, password) {
    // You can use fetch or another method to send this data to your server
    return new Promise((resolve, reject) => {
        try {
            fetch(ADMINISTRATOR_ROOT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, 'service':'login' })
            }).then(response => response.json())
                .then((data) => {
                    if (data.status_code == 401) {
                        reject(false)
                    }
                    else {

                        const key = data.login_key;
                        // save the mirror link login_key key in cookie
                        // console.log('key',data)
                        resolve(key)
                    }
                }).catch((error) => {
                    console.log(error)
                    reject(false)
                })
        }

        catch {
            reject(false)

        }
    })
}
function MAKE_REGISTER(username, password, email, contact, profile_image_url, address_line_1, address_line_2, address_line_3) {
    // 'username', 'password', 'email_id', 'profile_image_url', 'contact', 'address_line_1', 'address_line_2', 'address_line_3'
    // You can use fetch or another method to send this data to your server
    return new Promise((resolve, reject) => {
        try {
            fetch(ADMINISTRATOR_ROOT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        'service':'register',
                        'username': username,
                        'password': password,
                        'email': email,
                        'contact': contact,
                        'profile_image_url': profile_image_url,
                        'address_line_1': address_line_1,
                        'address_line_2': address_line_2,
                        'address_line_3': address_line_3,
                    })
            }).then(response => response.json())
                .then((data) => {
                    if (data.status_code == 401) {
                        reject(false)
                    }
                    else {
                        const key = data.login_key;
                        // save the mirror link websocket key in cookie
                        document.cookie = key
                        resolve(true)
                    }
                }).catch((error) => {
                    console.log(error)
                    reject(false)
                })
        }

        catch {
            reject(false)

        }
    })
}
function ESTABLISH_WEBSOCKET_CONNECTION() {
    //     Here are the possible values for readyState:

    // 0: CONNECTING – The connection is not yet open.
    // 1: OPEN – The connection is open and ready to communicate.
    // 2: CLOSING – The connection is in the process of closing.
    // 3: CLOSED – The connection is closed or could not be opened.
    return new Promise((resolve, reject) => {
        // get the websocket mirrorlink key from the brower cookie
        const key = document.cookie
        if (key) {


            socket = new WebSocket(SERVER_WEBSOCKET_URL + `key=${key}`);

            // Listen for the connection to be established
            socket.onopen = function () {
                console.log('MirrorLink Server Socket connected');
                resolve(true)
            };

            // Listen for messages from the server
            socket.onmessage = function (event) {
                const data = JSON.parse(event.data);
                //   console.log('Message from server:', data);
            };

            socket.onclose = (e) => {
                console.log('MirrorLink Server Socet DisConnected!', e)
                reject(false)
            }

        }
    })


}
function GET_AVAILABLE_SITES(login_key) {
    return new Promise((resolve, reject) => {
        try {
            fetch(ADMINISTRATOR_ROOT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        'service': 'GetMySites',
                        'login_key':login_key
                    })
            }).then(response => response.json())
                .then((data) => {
                    console.log(data)
                    if (data.status_code == 401) {
                        reject(false)
                    }
                    else {
                        // console.log(data.data)
                        resolve(data)
                    }
                }).catch((error) => {
                    console.log(error)
                    reject(false)
                })
        }
        catch {
            reject(false)
        }
    })
}

function GET_AVAILABLE_MIRRORS_ON_SITE(login_key , site_id ) {

    return new Promise((resolve, reject) => {
        try {
            fetch(ADMINISTRATOR_ROOT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        'service': 'GetMyMirrors',
                        'login_key':login_key,
                        'site_id':site_id,
                    })
            }).then(response => response.json())
                .then((data) => {
                    console.log(data)
                    if (data.status_code == 401) {
                        reject(false)
                    }
                    else {
                        // console.log(data.data)
                        resolve(data)
                    }
                }).catch((error) => {
                    console.log(error)
                    reject(false)
                })
        }
        catch {
            reject(false)
        }
    })
}

function GET_AVAILABLE_CONTENTS_ON_SITE(login_key, site_id, mirror_id) {
    return new Promise((resolve, reject) => {
        try {
            fetch(ADMINISTRATOR_ROOT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        'service': 'GetMyContents',
                        'login_key':login_key,
                        'site_id':site_id,
                        'mirror_id':mirror_id,
                    })
            }).then(response => response.json())
                .then((data) => {
                    console.log(data)
                    if (data.status_code == 401) {
                        reject(false)
                    }
                    else {
                        // console.log(data.data)
                        resolve(data)
                    }
                }).catch((error) => {
                    console.log(error)
                    reject(false)
                })
        }
        catch {
            reject(false)
        }
    })
}function GET_MIRROR(login_key, mirror_id) {
    return new Promise((resolve, reject) => {
        try {
            fetch(ADMINISTRATOR_ROOT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        'service': 'GetMirrorDetails',
                        'login_key':login_key,
                        'mirror_id':mirror_id,
                    })
            }).then(response => response.json())
                .then((data) => {
                    console.log(data)
                    if (data.status_code == 401) {
                        reject(false)
                    }
                    else {
                        // console.log(data.data)
                        resolve(data)
                    }
                }).catch((error) => {
                    console.log(error)
                    reject(false)
                })
        }
        catch {
            reject(false)
        }
    })
}

function GET_CONTENT_DETAILS(login_key, content_id){
    return new Promise((resolve, reject) => {
        try {
            fetch(ADMINISTRATOR_ROOT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "service": "GetContentDetails",
                    "content_id": content_id,
                    "login_key":login_key,
                })
            }).then(response => response.json())
                .then((data) => {
                    // console.log(data)
                    if (data.status_code == 401) {
                        reject()
                    }
                    else {
                        // console.log(data.data)
                        resolve(data)
                    }
                }).catch((error) => {
                    console.log(error)
                    reject()
                })
        }
        catch {
            reject()
        }
       
    })
}

function ADD_SITE_IN_ACCOUNT(login_key, sitename, site_description) {

    return new Promise((resolve, reject) => {
        try {
            fetch(ADMINISTRATOR_ROOT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "service": "AddSite",
                    "site_name": sitename,
                    "site_description": site_description,
                    "login_key":login_key,
                })
            }).then(response => response.json())
                .then((data) => {
                    // console.log(data)
                    if (data.status_code == 401) {
                        reject()
                    }
                    else {
                        // console.log(data.data)
                        resolve()
                    }
                }).catch((error) => {
                    console.log(error)
                    reject()
                })
        }
        catch {
            reject()
        }
       
    })
}
function ADD_MIRROR_IN_SITE(login_key, mirrorname, mirrordescription, username, password, site_id, height, width) {

    return new Promise((resolve, reject) => {
        const request_data = {
            "service": "AddMirror",
            "mirror_name": mirrorname,
            "mirror_description": mirrordescription,
            "username": username,
            "password": password,
            "site_id": site_id,
            "height":height,
            "width":width,
            "login_key":login_key
        }
        
    
            try {
                fetch(ADMINISTRATOR_ROOT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(request_data)
                }).then(response => response.json())
                    .then((data) => {
                        // console.log(data)
                        if (data.status_code == 401) {
                            reject()
                        }
                        else {
                            console.log(data.data)
                            resolve()
                        }
                    }).catch((error) => {
                        console.log(error)
                        reject()
                    })
            }
            catch {
                reject()
            }
           
       
    })
}
function ADD_CONTENT_IN_MIRROR(login_key,content_title, content_description, mirror_id, site_id, content) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();
        reader.onload = function (event) {
            const fileData = event.target.result;
            const fileExtension = content.type.split('/')[1]; // Get the file extension from the MIME type
            console.log(content, fileExtension)

            const request_data = {
                "service": "AddContent",
                "content_title": content_title,
                "content_description": content_description,
                "site_id": site_id,
                "mirror_id": mirror_id,
                "content": fileData,
                "login_key":login_key,
                "file_extention":fileExtension,
            }
              
            try {
                fetch(ADMINISTRATOR_ROOT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(request_data)
                }).then(response => response.json())
                    .then((data) => {
                        // console.log(data)
                        if (data.status_code == 401) {
                            reject()
                        }
                        else {
                            // console.log(data.data)
                            resolve()
                        }
                    }).catch((error) => {
                        console.log(error)
                        reject()
                    })
            }
            catch {
                reject()
            }

        }

        reader.readAsDataURL(content);

    })
}

function DELETE_MIRROR(login_key,mirror_id) {

    return new Promise((resolve, reject) => {
            const request_data = {
                "service": "DeleteMirror",
                "mirror_id": mirror_id,
                "login_key":login_key
            }
            try {
                fetch(ADMINISTRATOR_ROOT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(request_data)
                }).then(response => response.json())
                    .then((data) => {
                        // console.log(data)
                        if (data.status_code == 401) {
                            reject()
                        }
                        else {
                            // console.log(data.data)
                            resolve()
                        }
                    }).catch((error) => {
                        console.log(error)
                        reject()
                    })
            }
            catch {
                reject()
            }
        })
}
function DELETE_SITE(login_key,site_id) {

    return new Promise((resolve, reject) => {
            const request_data = {
                "service": "DeleteSite",
                "site_id": site_id,
                "login_key":login_key
            }
            try {
                fetch(ADMINISTRATOR_ROOT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(request_data)
                }).then(response => response.json())
                    .then((data) => {
                        // console.log(data)
                        if (data.status_code == 401) {
                            reject()
                        }
                        else {
                            // console.log(data.data)
                            resolve()
                        }
                    }).catch((error) => {
                        console.log(error)
                        reject()
                    })
            }
            catch {
                reject()
            }
        })
}
function DELETE_CONTENT(login_key,content_id) {

    return new Promise((resolve, reject) => {
            const request_data = {
                "service": "DeleteContent",
                "content_id": content_id,
                "login_key":login_key
            }
            try {
                fetch(ADMINISTRATOR_ROOT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(request_data)
                }).then(response => response.json())
                    .then((data) => {
                        // console.log(data)
                        if (data.status_code == 401) {
                            reject()
                        }
                        else {
                            // console.log(data.data)
                            resolve()
                        }
                    }).catch((error) => {
                        console.log(error)
                        reject()
                    })
            }
            catch {
                reject()
            }
        })
}


export {
    MAKE_LOGIN,
    ESTABLISH_WEBSOCKET_CONNECTION,
    GET_AVAILABLE_SITES,
    GET_AVAILABLE_MIRRORS_ON_SITE,
    ADD_SITE_IN_ACCOUNT,
    ADD_MIRROR_IN_SITE,
    GET_AVAILABLE_CONTENTS_ON_SITE,
    ADD_CONTENT_IN_MIRROR,
    MAKE_REGISTER,
    GET_CONTENT_DETAILS,GET_MIRROR,
    DELETE_CONTENT,
    DELETE_MIRROR,
    DELETE_SITE
}