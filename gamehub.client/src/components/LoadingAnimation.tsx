import classes from './LoadingAnimation.module.css'

interface Props {
    opt?: string;
}

const LoadingAnimation = ({ opt }: Props) => {

    return (
        <div className={classes.loaderController}>
            <div className={classes.loader}>

                {opt === "small" && (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="40">
                            <radialGradient id="a11" cx=".66" fx=".66" cy=".5" fy=".5" gradientTransform="scale(1.5)">
                                <stop offset="0" stop-color="#00C6CF"></stop>
                                <stop offset=".3" stop-color="#00C6CF" stop-opacity=".9"></stop>
                                <stop offset=".6" stop-color="#00C6CF" stop-opacity=".6"></stop>
                                <stop offset=".8" stop-color="#00C6CF" stop-opacity=".3"></stop>
                                <stop offset="1" stop-color="#00C6CF" stop-opacity="0"></stop>
                            </radialGradient>
                            <circle transform-origin="center" fill="none" stroke="url(#a11)" stroke-width="12" stroke-linecap="round" stroke-dasharray="200 1000" stroke-dashoffset="0" cx="100" cy="100" r="40">
                                <animateTransform type="rotate" attributeName="transform" calcMode="spline" dur="2" values="360;0" keyTimes="0;1" keySplines="0 0 1 1" repeatCount="indefinite"></animateTransform>
                            </circle>
                            <circle transform-origin="center" fill="none" opacity=".2" stroke="#00C6CF" stroke-width="12" stroke-linecap="round" cx="100" cy="100" r="40"></circle>
                        </svg>
                    </>
                )}

                {opt === "medium" && (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="55">
                            <radialGradient id="a11" cx=".66" fx=".66" cy=".2125" fy=".2125" gradientTransform="scale(1.5)">
                                <stop offset="0" stop-color="#00C6CF"></stop>
                                <stop offset=".3" stop-color="#00C6CF" stop-opacity=".9"></stop>
                                <stop offset=".6" stop-color="#00C6CF" stop-opacity=".6"></stop>
                                <stop offset=".8" stop-color="#00C6CF" stop-opacity=".3"></stop>
                                <stop offset="1" stop-color="#00C6CF" stop-opacity="0"></stop>
                            </radialGradient>
                            <circle transform-origin="center" fill="none" stroke="url(#a11)" stroke-width="12" stroke-linecap="round" stroke-dasharray="200 1000" stroke-dashoffset="0" cx="100" cy="100" r="55">
                                <animateTransform type="rotate" attributeName="transform" calcMode="spline" dur="2" values="360;0" keyTimes="0;1" keySplines="0 0 1 1" repeatCount="indefinite"></animateTransform>
                            </circle>
                            <circle transform-origin="center" fill="none" opacity=".2" stroke="#00C6CF" stroke-width="12" stroke-linecap="round" cx="100" cy="100" r="55"></circle>
                        </svg>
                    </>
                )}

                {opt === "generic" && (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                            <radialGradient id="a11" cx=".66" fx=".66" cy=".5125" fy=".5125" gradientTransform="scale(1.5)">
                                <stop offset="0" stop-color="#00C6CF"></stop>
                                <stop offset=".3" stop-color="#00C6CF" stop-opacity=".9"></stop>
                                <stop offset=".6" stop-color="#00C6CF" stop-opacity=".6"></stop>
                                <stop offset=".8" stop-color="#00C6CF" stop-opacity=".3"></stop>
                                <stop offset="1" stop-color="#00C6CF" stop-opacity="0"></stop>
                            </radialGradient>
                            <circle transform-origin="center" fill="none" stroke="url(#a11)" stroke-width="10" stroke-linecap="round" stroke-dasharray="200 1000" stroke-dashoffset="0" cx="100" cy="100" r="40">
                                <animateTransform type="rotate" attributeName="transform" calcMode="spline" dur="2" values="360;0" keyTimes="0;1" keySplines="0 0 1 1" repeatCount="indefinite"></animateTransform>
                            </circle>
                            <circle transform-origin="center" fill="none" opacity=".2" stroke="#00C6CF" stroke-width="10" stroke-linecap="round" cx="100" cy="100" r="40"></circle>
                        </svg>
                        <p>Carregando...</p>
                    </>
                )}

                {opt === "post" && (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                            <radialGradient id="a11" cx=".66" fx=".66" cy=".2125" fy=".2125" gradientTransform="scale(1.5)">
                                <stop offset="0" stop-color="#00C6CF"></stop>
                                <stop offset=".3" stop-color="#00C6CF" stop-opacity=".9"></stop>
                                <stop offset=".6" stop-color="#00C6CF" stop-opacity=".6"></stop>
                                <stop offset=".8" stop-color="#00C6CF" stop-opacity=".3"></stop>
                                <stop offset="1" stop-color="#00C6CF" stop-opacity="0"></stop>
                            </radialGradient>
                            <circle transform-origin="center" fill="none" stroke="url(#a11)" stroke-width="15" stroke-linecap="round" stroke-dasharray="200 1000" stroke-dashoffset="0" cx="100" cy="100" r="50">
                                <animateTransform type="rotate" attributeName="transform" calcMode="spline" dur="2" values="360;0" keyTimes="0;1" keySplines="0 0 1 1" repeatCount="indefinite"></animateTransform>
                            </circle>
                            <circle transform-origin="center" fill="none" opacity=".2" stroke="#00C6CF" stroke-width="15" stroke-linecap="round" cx="100" cy="100" r="50"></circle>
                        </svg>
                        <p className={classes.post}>Carregando posts...</p>
                    </>
                )}

                {opt === "user" && (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                            <radialGradient id="a11" cx=".66" fx=".66" cy=".3125" fy=".3125" gradientTransform="scale(1.5)">
                                <stop offset="0" stop-color="#00C6CF"></stop>
                                <stop offset=".3" stop-color="#00C6CF" stop-opacity=".9"></stop>
                                <stop offset=".6" stop-color="#00C6CF" stop-opacity=".6"></stop>
                                <stop offset=".8" stop-color="#00C6CF" stop-opacity=".3"></stop>
                                <stop offset="1" stop-color="#00C6CF" stop-opacity="0"></stop>
                            </radialGradient>
                            <circle transform-origin="center" fill="none" stroke="url(#a11)" stroke-width="15" stroke-linecap="round" stroke-dasharray="200 1000" stroke-dashoffset="0" cx="100" cy="100" r="70">
                                <animateTransform type="rotate" attributeName="transform" calcMode="spline" dur="2" values="360;0" keyTimes="0;1" keySplines="0 0 1 1" repeatCount="indefinite"></animateTransform>
                            </circle>
                            <circle transform-origin="center" fill="none" opacity=".2" stroke="#00C6CF" stroke-width="15" stroke-linecap="round" cx="100" cy="100" r="70"></circle>
                        </svg>
                        <p className={classes.user}>Carregando usuário...</p>
                    </>
                )}
            </div>
        </div>
    )
}

export default LoadingAnimation