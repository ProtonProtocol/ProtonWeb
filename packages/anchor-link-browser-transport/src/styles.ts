export default `
/* Anchor Link */

.%prefix% * {
    box-sizing: border-box;
    line-height: 1;
}

.%prefix% {
    font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
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
    background: #EFF1F7;
    margin: 20px;
    padding-top: 50px;
    border-radius: 20px;
    box-shadow: 0px 4px 100px rgba(0, 0, 0, .5);
    width: 340px;
    transition-property: all;
    transition-duration: .5s;
    transition-timing-function: ease-in-out;
    position: relative;
}

.%prefix%-close {
    display: block;
    position: absolute;
    top: 11px;
    right: 16px;
    width: 28px;
    height: 28px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M.57 12.1a.96.96 0 000 1.34c.37.36 1 .36 1.34 0L7 8.37l5.09 5.09c.36.35.97.35 1.34-.01a.96.96 0 000-1.34L8.34 7.01l5.08-5.08a.95.95 0 000-1.33.97.97 0 00-1.34-.01L6.99 5.68 1.91.59a.96.96 0 00-1.33 0 .97.97 0 00-.01 1.34l5.09 5.08-5.1 5.1z' fill='%23007AFF'/%3E%3C/svg%3E");
    background-size: 14px;
    background-repeat: no-repeat;
    background-position: 50% 7px;
    border-radius: 100%;
    cursor: pointer;
}

.%prefix%-close:hover {
    background-color: white;
}

.%prefix%-logo {
    width: 70px;
    height: 70px;
    margin: 0 auto;
    margin-top: -56px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23fff' d='M18.81 9.19h33.25V59.5H18.81z'/%3E%3Cpath d='M38.45 28.88h-6.9L35 21.77l3.45 7.1z' fill='%233650A2'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M35 70a35 35 0 100-70 35 35 0 000 70zm2.36-55.4a2.62 2.62 0 00-4.72 0L21.9 36.75h5.84l1.7-3.5h11.13l1.7 3.5h5.83L37.36 14.6zM48.13 44.2h-5.26a7.76 7.76 0 01-5.24 7v-10.5a2.62 2.62 0 10-5.25 0v10.5a7.76 7.76 0 01-5.25-7h-5.25c.16 7.06 6 12.69 13.12 12.69 7.12 0 12.97-5.63 13.13-12.7z' fill='%233650A2'/%3E%3C/svg%3E");
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
    padding: 20px;
    border-radius: 20px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    background: white;
}

.%prefix%-info {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.%prefix%-title {
    color: #000000;
    font-size: 25px;
    margin-top: 14px;
    font-weight: bold;
    line-height: 30px;
}

.%prefix%-subtitle {
    margin: 14px 0;
    color: #5C5C5C;
    text-align: center;
    line-height: 1.3;
}

.%prefix%-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.%prefix%-uri {
    width: 100%;
}

.%prefix%-uri a {
    color: #007AFF;
    background: #EFF1F7;
    text-decoration: none;
    font-size: 17px;
    flex-grow: 1;
    flex: 1;
    width: 100%;
    line-height: 1;
    padding: 20px 18px;
    border-radius: 12px;
    font-weight: 400;
    text-align: center;
    display: block;
    margin-top: 1em;
}

.%prefix%-qr {
    margin-top: 1em;
}

.%prefix%-qr svg {
    width: 100%;
}

.%prefix%-footnote {
    text-align: center;

    width: 100%;
    position: absolute;
    bottom: -26px;
    left: 0;
    color: white;
}

.%prefix%-footnote a {
    color: white;
}

.%prefix%-wskeepalive {
    display: none;
}



@media (prefers-color-scheme: dark) {
    .%prefix%-inner {
        background: #262D43;
        color: white;
    }
    .%prefix%-request {
        background: #131B33;
    }
    .%prefix%-title {
        color: #FCFCFC;
    }
    .%prefix%-subtitle {
        color: #B8C0DA;
    }
    .%prefix%-qr svg path {
        fill: #131B33;
    }
    .%prefix%-qr svg path:last-child {
        stroke: white;
    }
    .%prefix%-uri a {
        color: #FCFCFC;
        background: #262D43;
    }
    .%prefix%-close {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M.57 12.1a.96.96 0 000 1.34c.37.36 1 .36 1.34 0L7 8.37l5.09 5.09c.36.35.97.35 1.34-.01a.96.96 0 000-1.34L8.34 7.01l5.08-5.08a.95.95 0 000-1.33.97.97 0 00-1.34-.01L6.99 5.68 1.91.59a.96.96 0 00-1.33 0 .97.97 0 00-.01 1.34l5.09 5.08-5.1 5.1z' fill='%23FCFCFC'/%3E%3C/svg%3E");
    }
    .%prefix%-close:hover {
        background-color: black;
    }
}
`
