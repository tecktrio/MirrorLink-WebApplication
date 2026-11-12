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
                        reject(new Error('Request failed due to invalid data'))
                    }
                    else {

                        const key = data.login_key;
                        // save the mirror link login_key key in cookie
                        // console.log('key',data)
                        resolve(key)
                    }
                }).catch((error) => {
                    console.log(error)
                    reject(new Error('Request failed due to invalid data'))
                })
        }

        catch {
            reject(new Error('Request failed due to invalid data'))

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
                        reject(new Error('Request failed due to invalid data'))
                    }
                    else {
                        const key = data.login_key;
                        // save the mirror link websocket key in cookie
                        document.cookie = key
                        resolve(true)
                    }
                }).catch((error) => {
                    console.log(error)
                    reject(new Error('Request failed due to invalid data'))
                })
        }

        catch {
            reject(new Error('Request failed due to invalid data'))

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
                reject(new Error('Request failed due to invalid data'))
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
                body: JSON.stringify({
                    'service': 'GetMySites',
                    'login_key': login_key || 'adminpassword'
                })
            }).then(response => response.json())
                .then((data) => {
                    if (data.status_code == 401) {
                        reject(new Error('Request failed due to invalid data'))
                    } else {
                        resolve(data)
                    }
                }).catch((error) => {
                    console.error("GET_AVAILABLE_SITES fetch error:", error)
                    reject(new Error('Request failed due to invalid data'))
                })
        }
        catch (e) {
            reject(e)
        }
    })
}

function GET_AVAILABLE_MIRRORS_ON_SITE(login_key , site_id ) {

    console.log("site_id",site_id )

    return new Promise((resolve, reject) => {

        let data = {
            
                "service": "GetMySiteMirrors",
                "site_id":site_id,
                'login_key':login_key
            
        }
        try {
            fetch(ADMINISTRATOR_ROOT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data
                  )
            }).then(response => response.json())
                .then((data) => {
                    console.log(data)
                    if (data.status_code == 401) {
                        reject(new Error('Request failed due to invalid data'))
                    }
                    else {
                        // console.log(data.data)
                        resolve(data)
                    }
                }).catch((error) => {
                    console.log(error)
                    reject(new Error('Request failed due to invalid data'))
                })
        }
        catch {
            reject(new Error('Request failed due to invalid data'))
        }
    })
}

function GET_ALL_CONTENTS(login_key) {
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
                        'login_key':login_key
                    })
            }).then(response => response.json())
                .then((data) => {
                    console.log(data)
                    if (data.status_code == 401) {
                        reject(new Error('Request failed due to invalid data'))
                    }
                    else {
                        // console.log(data.data)
                        resolve(data)
                    }
                }).catch((error) => {
                    console.log(error)
                    reject(new Error('Request failed due to invalid data'))
                })
        }
        catch {
            reject(new Error('Request failed due to invalid data'))
        }
    })
}

function GET_AVAILABLE_CONTENTS_ON_SITE(login_key, mirror_id) {
    return new Promise((resolve, reject) => {
        try {
            fetch(ADMINISTRATOR_ROOT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        'service': 'GetContentsForThisMirror',
                        'login_key':login_key,
                        'mirror_id':mirror_id,
                    })
            }).then(response => response.json())
                .then((data) => {
                    console.log(data)
                    if (data.status_code == 401) {
                        reject(new Error('Request failed due to invalid data'))
                    }
                    else {
                        // console.log(data.data)
                        resolve(data)
                    }
                }).catch((error) => {
                    console.log(error)
                    reject(new Error('Request failed due to invalid data'))
                })
        }
        catch {
            reject(new Error('Request failed due to invalid data'))
        }
    })
}

function GET_MIRROR(login_key, mirror_id) {
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
                        reject(new Error('Request failed due to invalid data'))
                    }
                    else {
                        // console.log(data.data)
                        resolve(data)
                    }
                }).catch((error) => {
                    console.log(error)
                    reject(new Error('Request failed due to invalid data'))
                })
        }
        catch {
            reject(new Error('Request failed due to invalid data'))
        }
    })
}

function GET_ALL_MIRRORS(login_key) {
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
                    })
            }).then(response => response.json())
                .then((data) => {
                    console.log(data)
                    if (data.status_code == 401) {
                        reject(new Error('Request failed due to invalid data'))
                    }
                    else {
                        // console.log(data.data)
                        resolve(data)
                    }
                }).catch((error) => {
                    console.log(error)
                    reject(new Error('Request failed due to invalid data'))
                })
        }
        catch {
            reject(new Error('Request failed due to invalid data'))
        }
    })
}

function GET_ALL_UNASSIGNED_MIRRORS(login_key) {
    return new Promise((resolve, reject) => {
        try {
            fetch(ADMINISTRATOR_ROOT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        'service': 'GetMyUnassignedMirrors',
                        'login_key':login_key,
                    })
            }).then(response => response.json())
                .then((data) => {
                    console.log(data)
                    if (data.status_code == 401) {
                        reject(new Error('Request failed due to invalid data'))
                    }
                    else {
                        // console.log(data.data)
                        resolve(data)
                    }
                }).catch((error) => {
                    console.log(error)
                    reject(new Error('Request failed due to invalid data'))
                })
        }
        catch {
            reject(new Error('Request failed due to invalid data'))
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
                        reject(new Error('Request failed due to invalid data'))
                    }
                    else {
                        // console.log(data.data)
                        resolve(data)
                    }
                }).catch((error) => {
                    console.log(error)
                    reject(new Error('Request failed due to invalid data'))
                })
        }
        catch {
            reject(new Error('Request failed due to invalid data'))
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
                    "site_description": site_description || '',
                    "login_key": login_key || 'adminpassword',
                })
            }).then(response => {
                if (!response.ok) {
                    return response.json().then(errData => {
                        throw new Error(errData.status_text || `HTTP error ${response.status}`);
                    }).catch(() => {
                        throw new Error(`HTTP error ${response.status}`);
                    });
                }
                return response.json();
            }).then((data) => {
                if (data.status_code && data.status_code >= 400) {
                    reject(new Error(data.status_text || 'Request failed'));
                } else {
                    resolve(data);
                }
            }).catch((error) => {
                console.error("ADD_SITE_IN_ACCOUNT error:", error);
                reject(error);
            });
        } catch (e) {
            reject(e);
        }
    });
}
function CREATE_MIRROR(login_key, name, description, username, password, height, width, site_id = null) {

    return new Promise((resolve, reject) => {
        const request_data = {
            "service": "AddMirror",
            "mirror_name": name,
            "mirror_description": description,
            "username": username,
            "password": password,
            "width": width,
            "login_key": login_key,
            "height": height,
            "contents": []
        }

        if (site_id) {
            request_data["site_id"] = site_id;
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
                            reject(new Error('Request failed due to invalid data'))
                        }
                        else {
                            console.log(data.data)
                            resolve()
                        }
                    }).catch((error) => {
                        console.log(error)
                        reject(new Error('Request failed due to invalid data'))
                    })
            }
            catch {
                reject(new Error('Request failed due to invalid data'))
            }
           
       
    })
}

function CREATE_CONTENT(login_key, content_title, content_description, content, mirror_id = null, duration = null, width = null, height = null) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();
        reader.onload = function (event) {
            const fileData = event.target.result;
            const fileExtension = content.type.split('/')[1] || 'jpg'; // Get the file extension from the MIME type
            console.log(content, fileExtension)

            const request_data = {
                "service": "AddContent",
                "content_title": content_title,
                "content_description": content_description,
                "content": fileData,
                "login_key": login_key,
                "file_extention": fileExtension,
            }

            if (mirror_id) {
                request_data["mirror_id"] = mirror_id;
            }
            if (duration) {
                request_data["duration"] = duration;
            }
            if (width !== null && width !== undefined) {
                request_data["width"] = width;
            }
            if (height !== null && height !== undefined) {
                request_data["height"] = height;
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
                            reject(new Error('Request failed due to invalid data'))
                        }
                        else {
                            // console.log(data.data)
                            resolve(data)
                        }
                    }).catch((error) => {
                        console.log(error)
                        reject(new Error('Request failed due to invalid data'))
                    })
            }
            catch {
                reject(new Error('Request failed due to invalid data'))
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
                            reject(new Error('Request failed due to invalid data'))
                        }
                        else {
                            // console.log(data.data)
                            resolve()
                        }
                    }).catch((error) => {
                        console.log(error)
                        reject(new Error('Request failed due to invalid data'))
                    })
            }
            catch {
                reject(new Error('Request failed due to invalid data'))
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
                            reject(new Error('Request failed due to invalid data'))
                        }
                        else {
                            // console.log(data.data)
                            resolve()
                        }
                    }).catch((error) => {
                        console.log(error)
                        reject(new Error('Request failed due to invalid data'))
                    })
            }
            catch {
                reject(new Error('Request failed due to invalid data'))
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
                            reject(new Error('Request failed due to invalid data'))
                        }
                        else {
                            // console.log(data.data)
                            resolve()
                        }
                    }).catch((error) => {
                        console.log(error)
                        reject(new Error('Request failed due to invalid data'))
                    })
            }
            catch {
                reject(new Error('Request failed due to invalid data'))
            }
        })
}

function ASSIGN_MIRROR_TO_SITE(login_key,mirrors,site_id) {

    console.log(site_id,)

    return new Promise((resolve, reject) => {
            const request_data = {
                "service": "AssignMirrorToSite",
                "mirrors": mirrors,
                "site_id":site_id,
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
                            reject(new Error('Request failed due to invalid data'))
                        }
                        else {
                            // console.log(data.data)
                            resolve()
                        }
                    }).catch((error) => {
                        console.log(error)
                        reject(new Error('Request failed due to invalid data'))
                    })
            }
            catch {
                reject(new Error('Request failed due to invalid data'))
            }
        })
}

function ASSIGN_CONTENT_TO_MIRROR(login_key,content_ids, mirror_id) {

    return new Promise((resolve, reject) => {
            const request_data = {
                "service": "AssignContentToMirror",
                "content_ids": content_ids,
                "mirror_id":mirror_id,
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
                            reject(new Error('Request failed due to invalid data'))
                        }
                        else {
                            // console.log(data.data)
                            resolve()
                        }
                    }).catch((error) => {
                        console.log(error)
                        reject(new Error('Request failed due to invalid data'))
                    })
            }
            catch {
                reject(new Error('Request failed due to invalid data'))
            }
        })
}

function REMOVE_CONTENT_FROM_MIRROR(login_key, content_id, mirror_id) {
    return new Promise((resolve, reject) => {
        const request_data = {
            "service": "RemoveContentFromMirror",
            "content_id": content_id,
            "mirror_id": mirror_id,
            "login_key": login_key || 'adminpassword'
        };
        try {
            fetch(ADMINISTRATOR_ROOT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request_data)
            }).then(response => response.json())
                .then((data) => {
                    if (data.status_code === 401) {
                        reject(new Error('Request failed due to invalid credentials'));
                    } else if (data.status_code && data.status_code >= 400) {
                        reject(new Error(data.status_text || 'Failed to remove content from mirror'));
                    } else {
                        resolve(data);
                    }
                }).catch((error) => {
                    console.error("RemoveContentFromMirror error:", error);
                    reject(error);
                });
        } catch (e) {
            reject(e);
        }
    });
}


function REFRESH_MIRROR_CONTENTS(login_key, mirror_id) {
    return new Promise((resolve, reject) => {
        let request_data = {
            'login_key': login_key || 'adminpassword',
            'mirror_id': mirror_id,
            'service': 'RefreshMirror'
        };
        try {
            fetch(ADMINISTRATOR_ROOT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request_data)
            }).then(response => response.json())
                .then((data) => {
                    if (data.status_code && data.status_code >= 400) {
                        reject(new Error(data.status_text || 'Failed to send refresh signal to mirror'));
                    } else {
                        resolve(data);
                    }
                }).catch((error) => {
                    console.error("RefreshMirror error:", error);
                    reject(error);
                });
        } catch (e) {
            reject(e);
        }
    });
}


function UPDATE_MIRROR_PLAYLIST_ORDER(login_key, mirror_id, ordered_content_ids) {
    return new Promise((resolve, reject) => {
        let request_data = {
            'login_key': login_key || 'adminpassword',
            'mirror_id': mirror_id,
            'ordered_content_ids': ordered_content_ids,
            'service': 'UpdateMirrorPlaylistOrder'
        };
        try {
            fetch(ADMINISTRATOR_ROOT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request_data)
            }).then(response => response.json())
                .then((data) => {
                    if (data.status_code && data.status_code >= 400) {
                        reject(new Error(data.status_text || 'Failed to update playlist order'));
                    } else {
                        resolve(data);
                    }
                }).catch((error) => {
                    console.error("UpdateMirrorPlaylistOrder error:", error);
                    reject(error);
                });
        } catch (e) {
            reject(e);
        }
    });
}


function CONTROL_PLAYBACK(login_key, mirror_id, action = 'toggle') {
    return new Promise((resolve, reject) => {
        let request_data = {
            'login_key': login_key || 'adminpassword',
            'mirror_id': mirror_id,
            'action': action,
            'service': 'ControlPlayback'
        };
        try {
            fetch(ADMINISTRATOR_ROOT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request_data)
            }).then(response => response.json())
                .then((data) => {
                    if (data.status_code && data.status_code >= 400) {
                        reject(new Error(data.status_text || 'Failed to control playback'));
                    } else {
                        resolve(data);
                    }
                }).catch((error) => {
                    console.error("ControlPlayback error:", error);
                    reject(error);
                });
        } catch (e) {
            reject(e);
        }
    });
}


function GET_MIRROR_LIVE_STATUS(login_key, mirror_id) {
    return new Promise((resolve, reject) => {
        let request_data = {
            'login_key': login_key || 'adminpassword',
            'mirror_id': mirror_id,
            'service': 'GetMirrorLiveStatus'
        };
        try {
            fetch(ADMINISTRATOR_ROOT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request_data)
            }).then(response => response.json())
                .then((data) => {
                    if (data.status_code && data.status_code >= 400) {
                        reject(new Error(data.status_text || 'Failed to get mirror live status'));
                    } else {
                        resolve(data);
                    }
                }).catch((error) => {
                    console.error("GetMirrorLiveStatus error:", error);
                    reject(error);
                });
        } catch (e) {
            reject(e);
        }
    });
}


function SYNC_CONNECTED_MIRRORS(login_key, mirror_id, index, content_id) {
    return new Promise((resolve, reject) => {
        let request_data = {
            'login_key': login_key || 'adminpassword',
            'mirror_id': mirror_id,
            'index': index,
            'content_id': content_id,
            'service': 'SyncConnectedMirrors'
        };
        try {
            fetch(ADMINISTRATOR_ROOT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request_data)
            }).then(response => response.json())
                .then((data) => {
                    if (data.status_code && data.status_code >= 400) {
                        reject(new Error(data.status_text || 'Failed to sync mirrors'));
                    } else {
                        resolve(data);
                    }
                }).catch((error) => {
                    console.error("SyncConnectedMirrors error:", error);
                    reject(error);
                });
        } catch (e) {
            reject(e);
        }
    });
}


function TOGGLE_CONTENT_STATUS_ON_MIRROR(login_key, mirror_id, content_id, is_active) {
    return new Promise((resolve, reject) => {
        let request_data = {
            'login_key': login_key || 'adminpassword',
            'mirror_id': mirror_id,
            'content_id': content_id,
            'is_active': is_active,
            'service': 'ToggleContentStatusOnMirror'
        };
        try {
            fetch(ADMINISTRATOR_ROOT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request_data)
            }).then(response => response.json())
                .then((data) => {
                    if (data.status_code && data.status_code >= 400) {
                        reject(new Error(data.status_text || 'Failed to update content status'));
                    } else {
                        resolve(data);
                    }
                }).catch((error) => {
                    console.error("ToggleContentStatusOnMirror error:", error);
                    reject(error);
                });
        } catch (e) {
            reject(e);
        }
    });
}


function UPDATE_PHOTO_SPEED(login_key, mirror_id, photo_duration, content_id = null, duration = null) {
    return new Promise((resolve, reject) => {
        const request_data = {
            "service": "UpdatePhotoSpeed",
            "login_key": login_key,
            "mirror_id": mirror_id,
            "photo_duration": photo_duration,
            "content_id": content_id,
            "duration": duration
        };
        try {
            fetch(ADMINISTRATOR_ROOT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request_data)
            }).then(response => response.json())
                .then((data) => {
                    if (data.status_code && data.status_code >= 400) {
                        reject(new Error(data.status_text || 'Failed to update photo speed'));
                    } else {
                        resolve(data);
                    }
                }).catch((error) => {
                    console.error("UpdatePhotoSpeed error:", error);
                    reject(error);
                });
        } catch (e) {
            reject(e);
        }
    });
}

export {
    MAKE_LOGIN,
    ESTABLISH_WEBSOCKET_CONNECTION,
    GET_AVAILABLE_SITES,
    GET_AVAILABLE_MIRRORS_ON_SITE,
    ADD_SITE_IN_ACCOUNT,
    CREATE_MIRROR,
    GET_AVAILABLE_CONTENTS_ON_SITE,
    CREATE_CONTENT,
    MAKE_REGISTER,
    GET_CONTENT_DETAILS,GET_MIRROR,
    DELETE_CONTENT,
    DELETE_MIRROR,
    DELETE_SITE,
    GET_ALL_MIRRORS,ASSIGN_MIRROR_TO_SITE,
    GET_ALL_UNASSIGNED_MIRRORS,
    GET_ALL_CONTENTS,
    ASSIGN_CONTENT_TO_MIRROR,
    REMOVE_CONTENT_FROM_MIRROR,
    REFRESH_MIRROR_CONTENTS,
    UPDATE_MIRROR_PLAYLIST_ORDER,
    CONTROL_PLAYBACK,
    GET_MIRROR_LIVE_STATUS,
    SYNC_CONNECTED_MIRRORS,
    TOGGLE_CONTENT_STATUS_ON_MIRROR,
    UPDATE_PHOTO_SPEED
}