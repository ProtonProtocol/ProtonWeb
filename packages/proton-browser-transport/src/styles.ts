export default `
/* Anchor Link */

.%prefix% * {
    box-sizing: border-box;
    line-height: 1;
}

.%prefix% {
    font-family: CircularStd, -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
        Arial, sans-serif;
    font-size: 13px;
    background: rgba(0, 0, 0, 0.65);
    position: fixed;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    z-index: 2147483647;
    display: none;
    align-items: center;
    justify-content: center;
}

.%prefix%-active {
    display: flex;
}

.%prefix%-inner {
    background: rgb(117, 46, 235);
    color: white;
    margin: 20px;
    border-radius: 20px;
    box-shadow: 0px 4px 100px rgba(0, 0, 0, .5);
    width: 360px;
    transition-property: all;
    transition-duration: .5s;
    transition-timing-function: ease-in-out;
    position: relative;
}

.%prefix%-nav {
    height: 55px;
    display: flex;
    border-radius: 20px 20px 0px 0px;
    justify-content: space-between;
    align-items: center;
    padding: 0px 16px;
    background-color: rgba(0,0,0,0.2);
}

.%prefix%-back {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg%3E%3Cg%3E%3Cpath d='M0 0L24 0 24 24 0 24z' transform='translate(-348 -152) translate(348 152)'/%3E%3Cpath fill='rgba(255,255,255, 0.8)' fill-rule='nonzero' d='M16.41 5.791L14.619 4 7 11.619 14.619 19.239 16.41 17.448 10.594 11.619z' transform='translate(-348 -152) translate(348 152)'/%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/svg%3E%0A");
    background-size: 22px;
    background-repeat: no-repeat;
    background-position: 50%;
    cursor: pointer;
    width: 16px;
    height: 16px;
}

.%prefix%-back:hover {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg%3E%3Cg%3E%3Cpath d='M0 0L24 0 24 24 0 24z' transform='translate(-348 -152) translate(348 152)'/%3E%3Cpath fill='rgba(255,255,255,1)' fill-rule='nonzero' d='M16.41 5.791L14.619 4 7 11.619 14.619 19.239 16.41 17.448 10.594 11.619z' transform='translate(-348 -152) translate(348 152)'/%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/svg%3E%0A");
}

.%prefix%-close {
    width: 16px;
    height: 16px;
    background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M9.66 10.987L6 7.327l-3.66 3.66A1.035 1.035 0 11.876 9.523l3.66-3.66-3.66-3.66A1.035 1.035 0 012.34.737L6 4.398 9.66.739a1.035 1.035 0 111.464 1.464l-3.66 3.66 3.66 3.661a1.035 1.035 0 11-1.464 1.464z' fill='rgba(255,255,255, 0.8)' fill-rule='nonzero'/%3E%3C/svg%3E");
    background-size: 14px;
    background-repeat: no-repeat;
    background-position: 50%;
    border-radius: 100%;
    cursor: pointer;
}

.%prefix%-close:hover {
    background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M9.66 10.987L6 7.327l-3.66 3.66A1.035 1.035 0 11.876 9.523l3.66-3.66-3.66-3.66A1.035 1.035 0 012.34.737L6 4.398 9.66.739a1.035 1.035 0 111.464 1.464l-3.66 3.66 3.66 3.661a1.035 1.035 0 11-1.464 1.464z' fill='rgba(255,255,255,1)' fill-rule='nonzero'/%3E%3C/svg%3E");
}

.%prefix%-logo {
    width: 100%;
    height: 50px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='49' viewBox='0 0 160 49'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFF'%3E%3Cg%3E%3Cpath fill-rule='nonzero' d='M58.895 32.064V27.53h3.547c1.361 0 2.547-.224 3.557-.673 1.01-.449 1.785-1.096 2.323-1.942.539-.845.808-1.836.808-2.974 0-1.152-.269-2.147-.808-2.985-.538-.838-1.313-1.481-2.323-1.93-1.01-.449-2.196-.673-3.557-.673h-6.464v15.711h2.917zm3.412-7.003h-3.412v-6.24h3.412c1.272 0 2.237.27 2.895.809.659.538.988 1.309.988 2.311 0 1.003-.33 1.774-.988 2.312-.658.539-1.623.808-2.895.808zm13.942 7.003v-4.579h3.633c.226-.001.4-.009.519-.022l3.21 4.601h3.142l-3.614-5.162c1.077-.42 1.904-1.055 2.48-1.908.576-.853.864-1.87.864-3.053 0-1.152-.269-2.147-.808-2.985-.538-.838-1.313-1.481-2.323-1.93-1.01-.449-2.195-.673-3.557-.673H73.33v15.711h2.918zm3.411-6.98H76.25v-6.262h3.411c1.272 0 2.237.269 2.896.808.658.538.987 1.309.987 2.311 0 1.003-.329 1.777-.987 2.324-.659.546-1.624.819-2.896.819zm18.7 7.205c1.601 0 3.045-.348 4.332-1.044 1.287-.696 2.297-1.657 3.03-2.884.733-1.227 1.1-2.611 1.1-4.153 0-1.54-.367-2.925-1.1-4.152-.733-1.227-1.743-2.188-3.03-2.884-1.287-.696-2.73-1.044-4.332-1.044-1.601 0-3.045.348-4.332 1.044-1.287.696-2.297 1.66-3.03 2.895-.733 1.235-1.1 2.615-1.1 4.141 0 1.527.367 2.907 1.1 4.141.733 1.235 1.743 2.2 3.03 2.896 1.287.696 2.73 1.044 4.332 1.044zm0-2.56c-1.047 0-1.99-.235-2.828-.706-.838-.471-1.496-1.13-1.975-1.975-.479-.846-.718-1.792-.718-2.84 0-1.047.239-1.993.718-2.839.479-.845 1.137-1.504 1.975-1.975.838-.471 1.78-.707 2.828-.707 1.047 0 1.99.236 2.828.707.838.471 1.496 1.13 1.975 1.975.479.846.718 1.792.718 2.84 0 1.047-.239 1.993-.718 2.839-.479.845-1.137 1.504-1.975 1.975-.838.471-1.78.707-2.828.707zm18.722 2.335V18.822h5.207v-2.47h-13.332v2.47h5.207v13.242h2.918zm15.805.225c1.6 0 3.045-.348 4.332-1.044 1.286-.696 2.296-1.657 3.03-2.884.733-1.227 1.1-2.611 1.1-4.153 0-1.54-.367-2.925-1.1-4.152-.734-1.227-1.744-2.188-3.03-2.884-1.287-.696-2.731-1.044-4.332-1.044s-3.045.348-4.332 1.044c-1.287.696-2.297 1.66-3.03 2.895-.733 1.235-1.1 2.615-1.1 4.141 0 1.527.367 2.907 1.1 4.141.733 1.235 1.743 2.2 3.03 2.896 1.287.696 2.73 1.044 4.332 1.044zm0-2.56c-1.048 0-1.99-.235-2.828-.706-.838-.471-1.497-1.13-1.976-1.975-.478-.846-.718-1.792-.718-2.84 0-1.047.24-1.993.718-2.839.48-.845 1.138-1.504 1.976-1.975.838-.471 1.78-.707 2.828-.707 1.047 0 1.99.236 2.828.707.838.471 1.496 1.13 1.975 1.975.479.846.718 1.792.718 2.84 0 1.047-.24 1.993-.718 2.839-.479.845-1.137 1.504-1.975 1.975-.838.471-1.78.707-2.828.707zm15.737 2.335V21.425l8.663 10.64h2.402V16.352h-2.895v10.639l-8.664-10.64h-2.402v15.712h2.896z' transform='translate(-432 -207) translate(432 207)'/%3E%3Cg%3E%3Cpath d='M21.582 0c3.104 0 5.782 3.222 7.545 8.459-.712.198-1.44.42-2.174.666-1.465-4.331-3.476-6.88-5.37-6.88-2.136 0-4.415 3.232-5.899 8.606.58.187 1.165.386 1.762.606 1.346.495 2.735 1.078 4.15 1.74.081-.038.162-.078.243-.115.907-.417 1.808-.801 2.7-1.154l.32-.125c2.671-1.033 5.252-1.773 7.616-2.165 5.088-.846 8.666.03 10.07 2.466 1.409 2.437.38 5.974-2.898 9.956-.189.228-.38.459-.583.686-.488-.542-1.007-1.083-1.561-1.625 2.891-3.354 4.03-6.285 3.1-7.895-.879-1.523-3.777-2.036-7.76-1.375-.85.142-1.735.333-2.643.57.13.596.25 1.205.357 1.835.246 1.41.436 2.903.57 4.458.7.492 1.384.991 2.04 1.5 2.572 1.99 4.78 4.078 6.48 6.143 3.277 3.982 4.307 7.519 2.899 9.956-1.055 1.83-3.338 2.78-6.567 2.78-1.067 0-2.238-.103-3.504-.315-.328-.054-.661-.115-.997-.182.201-.696.388-1.424.557-2.178.273.055.542.103.808.148 3.98.66 6.881.147 7.76-1.376 1.068-1.85-.6-5.449-4.522-9.428-.391.357-.794.713-1.21 1.066-.062.051-.126.106-.187.154-1.11.93-2.302 1.842-3.561 2.728-.06.704-.13 1.4-.213 2.075-1.225 9.863-4.829 16.632-9.328 16.632-3.097 0-5.771-3.213-7.535-8.436.709-.193 1.434-.417 2.175-.667 1.465 4.319 3.469 6.858 5.36 6.858 2.136 0 4.42-3.243 5.907-8.631-.583-.186-1.17-.383-1.764-.603-1.355-.494-2.738-1.07-4.13-1.716l-.09.042c-.785.366-1.558.706-2.321 1.02-.119.048-.234.096-.35.138-4.392 1.77-8.404 2.687-11.594 2.687-3.177 0-5.534-.911-6.624-2.796-1.559-2.7-.084-6.654 3.607-10.822l1.568 1.654c-2.985 3.419-4.172 6.413-3.23 8.045 1.067 1.849 5.006 2.206 10.402.805-.127-.595-.248-1.202-.355-1.83-.244-1.41-.433-2.898-.569-4.45-.703-.491-1.387-.988-2.035-1.486C3.752 23.42 0 18.312 0 14.51c0-.879.202-1.687.616-2.405C2.168 9.42 6.288 8.712 11.697 9.796c-.205.705-.394 1.442-.564 2.206-4.448-.879-7.632-.408-8.571 1.224-1.067 1.848.594 5.44 4.504 9.413.502-.455 1.022-.907 1.569-1.355 1.053-.871 2.194-1.736 3.407-2.586.061-.706.13-1.403.216-2.08C13.483 6.767 17.087 0 21.582 0zm7.103 31.336c-.54.342-1.087.68-1.645 1.01-.19.113-.379.222-.568.33-.664.382-1.327.75-1.985 1.097-.097.052-.194.1-.29.152.681.288 1.358.558 2.028.807.605.225 1.202.431 1.794.625.132-.615.254-1.248.364-1.904.115-.681.212-1.393.302-2.117zm-14.212-.003c.094.76.203 1.5.325 2.212.105.624.224 1.224.35 1.81.363-.118.73-.24 1.102-.373.112-.039.228-.08.34-.122.766-.276 1.552-.58 2.353-.923l.023-.01c-.759-.397-1.518-.814-2.273-1.25-.039-.023-.08-.045-.12-.071-.72-.418-1.418-.844-2.1-1.273zm7.11-15.65c-.767.373-1.537.765-2.306 1.183-.487.263-.975.535-1.462.817-1.277.738-2.48 1.495-3.615 2.261-.046.654-.086 1.316-.111 1.997-.029.741-.042 1.498-.042 2.267 0 1.476.054 2.897.151 4.263.655.443 1.329.882 2.033 1.313.516.321 1.042.638 1.584.95 1.254.724 2.515 1.39 3.77 2 .08-.04.16-.075.241-.115.834-.41 1.677-.853 2.533-1.328.33-.18.66-.365.99-.558 1.278-.736 2.481-1.493 3.615-2.26.047-.654.087-1.317.112-1.998.029-.74.041-1.497.041-2.267 0-1.475-.054-2.895-.15-4.262-.653-.44-1.326-.88-2.03-1.314-.516-.32-1.045-.634-1.587-.949-1.277-.737-2.535-1.4-3.767-2zm0 5.64c1.593 0 2.885 1.292 2.885 2.885 0 1.594-1.292 2.886-2.886 2.886-1.593 0-2.885-1.292-2.885-2.886 0-1.593 1.292-2.885 2.885-2.885zm9.729.3c.033.847.05 1.71.05 2.585 0 .212 0 .424-.003.635-.007.663-.027 1.315-.052 1.96.578-.436 1.132-.874 1.661-1.312.068-.055.132-.106.196-.16.449-.376.878-.75 1.29-1.123-.378-.34-.77-.683-1.178-1.026-.619-.522-1.278-1.042-1.964-1.56zm-19.454-.006c-.52.392-1.021.785-1.501 1.177-.579.47-1.127.943-1.649 1.416.379.341.771.684 1.18 1.028.62.52 1.279 1.039 1.966 1.557-.034-.847-.051-1.71-.051-2.587 0-.211 0-.423.006-.631.005-.662.024-1.314.049-1.96zm16.158-8.556c-.3.097-.6.198-.903.303-.891.308-1.795.658-2.712 1.042l-.195.084c.75.396 1.507.812 2.266 1.25.039.023.08.045.119.07.717.414 1.414.842 2.1 1.277-.093-.762-.202-1.502-.324-2.216-.107-.623-.226-1.224-.351-1.81zm-12.87 0c-.13.613-.251 1.246-.361 1.9-.117.682-.215 1.391-.305 2.115.684-.432 1.387-.859 2.11-1.278l.103-.058c.757-.437 1.517-.853 2.276-1.25-.688-.29-1.364-.56-2.026-.805-.613-.23-1.21-.435-1.796-.624z' transform='translate(-432 -207) translate(432 207)'/%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/svg%3E%0A");    background-repeat: no-repeat;
    background-position: 50%;
    background-repeat: no-repeat;
    margin-bottom: 20px;
}

.%prefix%-logo.loading {
    border-radius: 100%;
    background-color: #3650A2;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0.5 0.5 45 45' xmlns='http://www.w3.org/2000/svg' stroke='%23fff'%3E%3Cg fill='none' fill-rule='evenodd' transform='translate(1 1)' stroke-width='2'%3E%3Ccircle cx='22' cy='22' r='6' stroke-opacity='0'%3E%3Canimate attributeName='r' begin='1.5s' dur='3s' values='6;22' calcMode='linear' repeatCount='indefinite' /%3E%3Canimate attributeName='stroke-opacity' begin='1.5s' dur='3s' values='1;0' calcMode='linear' repeatCount='indefinite' /%3E%3Canimate attributeName='stroke-width' begin='1.5s' dur='3s' values='2;0' calcMode='linear' repeatCount='indefinite' /%3E%3C/circle%3E%3Ccircle cx='22' cy='22' r='6' stroke-opacity='0'%3E%3Canimate attributeName='r' begin='3s' dur='3s' values='6;22' calcMode='linear' repeatCount='indefinite' /%3E%3Canimate attributeName='stroke-opacity' begin='3s' dur='3s' values='1;0' calcMode='linear' repeatCount='indefinite' /%3E%3Canimate attributeName='stroke-width' begin='3s' dur='3s' values='2;0' calcMode='linear' repeatCount='indefinite' /%3E%3C/circle%3E%3Ccircle cx='22' cy='22' r='8'%3E%3Canimate attributeName='r' begin='0s' dur='1.5s' values='6;1;2;3;4;5;6' calcMode='linear' repeatCount='indefinite' /%3E%3C/circle%3E%3C/g%3E%3C/svg%3E");
}

.%prefix%-logo.error {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 70 70'%3E%3Cdefs/%3E%3Ccircle cx='35' cy='35' r='35' fill='%23FC3D39'/%3E%3Cpath fill='%23fff' d='M22.3 48h25.4c2.5 0 4-1.7 4-4a4 4 0 00-.5-2L38.5 19.3a4 4 0 00-3.5-2 4 4 0 00-3.5 2L18.8 42.1c-.3.6-.5 1.3-.5 2 0 2.2 1.6 4 4 4zM35 37c-.9 0-1.4-.6-1.4-1.5l-.2-7.7c0-.9.6-1.6 1.6-1.6s1.7.7 1.7 1.6l-.3 7.7c0 1-.5 1.5-1.4 1.5zm0 6c-1 0-1.9-.8-1.9-1.8s.9-1.8 2-1.8c1 0 1.8.7 1.8 1.8 0 1-.9 1.8-1.9 1.8z'/%3E%3C/svg%3E");
}

.%prefix%-logo.success {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 70 70'%3E%3Cdefs/%3E%3Ccircle cx='35' cy='35' r='35' fill='%233DC55D'/%3E%3Cpath fill='%23fff' d='M30.9 49.7a2 2 0 001.8-1L48 24.9c.3-.5.4-1 .4-1.4 0-1-.7-1.7-1.7-1.7-.8 0-1.2.3-1.6 1L30.8 45.4 23.5 36c-.5-.6-1-.9-1.6-.9-1 0-1.8.8-1.8 1.8 0 .4.2.9.6 1.3L29 48.7c.6.7 1.1 1 1.9 1z'/%3E%3C/svg%3E");
}

.%prefix%-request {
    padding: 20px 55px 40px 55px;
    border-radius: 20px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
}

.%prefix%-separator {
    margin-top: 20px;
    width: 100%;
    font-size: 12px;
    display: flex;
    align-items: center;
    text-align: center;
    color: white;
}

.%prefix%-separator::before,
.%prefix%-separator::after {
    content: '';
    flex: 1;
    opacity: 0.2;
    border-bottom: 1px solid #d8d8d8;
}

.%prefix%-separator::before {
    margin-right: .5em;
}

.%prefix%-separator::after {
    margin-left: .5em;
}

.%prefix%-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
}

.%prefix%-uri {
    width: 100%;
    padding: 20px 4px 0px 4px;
}

.%prefix%-background {
    width: 250px;
    height: 250px;
    border-radius: 10px;
    box-shadow: 0 4px 8px -2px rgba(141, 141, 148, 0.28), 0 0 2px 0 rgba(141, 141, 148, 0.16);
    background-color: #ffffff;
    position: relative;
    z-index: 10;
}

.%prefix%-qr {
    width: 210px;
    position: absolute;
    z-index: 5;
    top: 20px;
    left: 20px;
}

.%prefix%-qr svg {
    width: 100%;
    fill: #010c2c;
}

.%prefix%-footnote {
    font-family: CircularStd-Book;
    font-size: 16px;
    text-align: center;
    width: 100%;
    position: absolute;
    bottom: -30px;
    left: 0;
    color: white;
}

.%prefix%-footnote a {
    color: white;
}

.%prefix%-wskeepalive {
    display: none;
}

.%prefix%-uri a {
    width: 100%;
    background-color: rgba(255, 255, 255, 0.3);
    font-family: CircularStd;
    font-size: 16px;
    font-weight: 500;
    text-align: center;
    color: #ffffff;
    text-decoration: none;
    flex-grow: 1;
    flex: 1;
    padding: 18px 0px 16px 0px;
    display: block;
}

.%prefix%-uri a:hover {
    background-color: rgba(255, 255, 255, 0.25);
    transition: 0.2s ease;
}
`
