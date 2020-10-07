export default `

.selector * {
    box-sizing: border-box;
    line-height: 1;
}

.selector {
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

.selector-active {
    display: flex;
}

.selector-inner {
    background: #010c2c;
    color: white;
    margin: 20px;
    padding-top: 50px;
    border-radius: 20px;
    box-shadow: 0px 4px 100px rgba(0, 0, 0, .5);
    width: 320px;
    transition-property: all;
    transition-duration: .5s;
    transition-timing-function: ease-in-out;
    position: relative;
}

.selector-close {
    display: block;
    position: absolute;
    top: 16px;
    right: 16px;
    width: 28px;
    height: 28px;
    background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M9.66 10.987L6 7.327l-3.66 3.66A1.035 1.035 0 11.876 9.523l3.66-3.66-3.66-3.66A1.035 1.035 0 012.34.737L6 4.398 9.66.739a1.035 1.035 0 111.464 1.464l-3.66 3.66 3.66 3.661a1.035 1.035 0 11-1.464 1.464z' fill='%23FFF' fill-rule='nonzero'/%3E%3C/svg%3E");
    background-size: 10px;
    background-repeat: no-repeat;
    background-position: 50%;
    border-radius: 100%;
    cursor: pointer;
    background-color: rgb(194, 162, 246, 0.2);
    transition: background-color 0.2s ease;
}

.selector-close:hover {
    background-color: rgb(194, 162, 246, 0.3);
    transition: background-color 0.2s ease;
}

.selector-connect {
    padding: 20px 20px 40px 20px;
    border-radius: 20px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    background: #010c2c;
}
}
`
