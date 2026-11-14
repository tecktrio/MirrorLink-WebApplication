// Request URL s and other Main urls for the application to communicate with server

// Request URLs and communication endpoints for server
const RAW_API_URL = process.env.REACT_APP_API_URL || "https://mirrorlink.bigburry.com/api";
const CLEAN_API_URL = RAW_API_URL.replace(/\/+$/, "");

export const SERVER_URL = `${CLEAN_API_URL}/`;
const wsProtocol = CLEAN_API_URL.startsWith("https") ? "wss:" : "ws:";
const urlHost = CLEAN_API_URL.replace(/^https?:\/\//, "").split("/")[0];
export const SERVER_WEBSOCKET_URL = `${wsProtocol}//${urlHost}/controller?`;

let socket;
const ADMINISTRATOR_ROOT_URL = `${SERVER_URL}Administrator`;


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
                body: JSON.stringify({ email: username, password, 'service':'login' })
            }).then(async response => ({ ok: response.ok, data: await response.json() }))
                .then(({ ok, data }) => {
                    if (!ok || data.status_code == 401) {
                        reject(new Error('Request failed due to invalid data'))
                    }
                    else {

                        const key = data.login_key;
                        // save the mirror link login_key key in cookie
                        // console.log('key',data)
                        resolve({ key, planActive: !!data.plan_active })
                    }
                }).catch((error) => {
                    console.log(error)
                    reject(error)
                })
        }

        catch {
            reject(new Error('Request failed due to invalid data'))

        }
    })
}
function AUTH_REQUEST(payload) {
    return fetch(ADMINISTRATOR_ROOT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.status_text || 'Request failed'); return data; });
}
export const REQUEST_EMAIL_OTP = (email, purpose) => AUTH_REQUEST({ service: 'request_otp', email, purpose });
export const RESET_PASSWORD = (email, otp, password) => AUTH_REQUEST({ service: 'reset_password', email, otp, password });
export const CHECK_PLAN = (login_key) => AUTH_REQUEST({ service: 'check_plan', login_key });
export const GET_SUBSCRIPTION_DETAILS = (login_key) => fetch(`${SERVER_URL}Billing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ service: 'get_subscription', login_key }),
}).then(async response => {
    const data = await response.json();
    if (!response.ok) throw new Error(data.status_text || 'Could not load subscription details.');
    return data;
});
function MAKE_REGISTER(username, password, email, contact, profile_image_url, address_line_1, address_line_2, address_line_3, otp) {
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
                        otp,
                        'username': username,
                        'password': password,
                        'email': email,
                        'contact': contact,
                        'profile_image_url': profile_image_url,
                        'address_line_1': address_line_1,
                        'address_line_2': address_line_2,
                        'address_line_3': address_line_3,
                    })
            }).then(async response => ({ ok: response.ok, data: await response.json() }))
                .then(({ ok, data }) => {
                    if (!ok || data.status_code >= 400) {
                        reject(new Error(data.status_text || 'Request failed'))
                    }
                    else {
                        resolve(data)
                    }
                }).catch((error) => {
                    console.log(error)
                    reject(error)
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

        reader.onerror = function (err) {
            console.error("FileReader error:", err);
            reject(new Error('Failed to read file for upload'));
        };

        reader.onload = function (event) {
            const fileData = event.target.result;
            
            // Extract accurate file extension
            let fileExtension = 'jpg';
            if (content.name && content.name.includes('.')) {
                fileExtension = content.name.split('.').pop().toLowerCase();
            } else if (content.type && content.type.includes('/')) {
                fileExtension = content.type.split('/')[1].toLowerCase();
            }

            if (fileExtension === 'quicktime') fileExtension = 'mov';
            console.log("Uploading media:", content.name, "Format:", fileExtension, "Size:", (content.size / 1024 / 1024).toFixed(2), "MB");

            const request_data = {
                "service": "AddContent",
                "content_title": content_title,
                "content_description": content_description,
                "content": fileData,
                "login_key": login_key,
                "file_extention": fileExtension,
            };

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
              
            fetch(ADMINISTRATOR_ROOT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request_data)
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.status_text || `Upload error HTTP ${response.status}`);
                    }).catch(e => {
                        throw new Error(e.message || `Upload server error HTTP ${response.status}`);
                    });
                }
                return response.json();
            })
            .then((data) => {
                if (data.status_code === 400 || data.status_code === 401 || data.status_code === 403) {
                    reject(new Error(data.status_text || 'Request failed due to invalid data'));
                } else {
                    resolve(data);
                }
            })
            .catch((error) => {
                console.error("CREATE_CONTENT error:", error);
                reject(error);
            });
        };

        reader.readAsDataURL(content);
    });
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
                }).then(async response => ({ ok: response.ok, data: await response.json() }))
                    .then(({ ok, data }) => {
                        if (!ok) reject(new Error(data.status_text || 'Could not delete mirror'))
                        else resolve(data)
                    }).catch((error) => {
                        console.log(error)
                        reject(error)
                    })
            }
            catch {
                reject(new Error('Request failed due to invalid data'))
            }
        })
}

function SET_MIRROR_ACTIVE_STATUS(login_key, mirror_id, is_active) {
    return fetch(ADMINISTRATOR_ROOT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'SetMirrorActiveStatus', login_key, mirror_id, is_active })
    }).then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.status_text || 'Could not update mirror status');
        return data;
    });
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

const MENU_REQUEST = (payload) => fetch(ADMINISTRATOR_ROOT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.status_text || 'Menu request failed'); return d; });
export const GET_MENU_TEMPLATES = () => MENU_REQUEST({ service: 'GetMenuTemplates' });
export const GET_MENUS = (login_key) => MENU_REQUEST({ service: 'GetMenus', login_key });
export const SAVE_MENU = (login_key, menu_id, template_id, data) => MENU_REQUEST({ service: 'SaveMenu', login_key, menu_id, template_id, data });
export const DELETE_MENU = (login_key, menu_id) => MENU_REQUEST({ service: 'DeleteMenu', login_key, menu_id });
export const RENDER_MENU_PREVIEW = (login_key, menu_id, width = 1920, height = 1080) => MENU_REQUEST({ service: 'RenderMenuPreview', login_key, menu_id, width, height });

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
    SET_MIRROR_ACTIVE_STATUS,
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
