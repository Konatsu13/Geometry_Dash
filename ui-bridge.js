(() => {

    function initSwipe() {

        const viewport =
            document.getElementById(
                "level-carousel-viewport"
            );

        if (!viewport) return;

        let startX = 0;
        let startY = 0;

        viewport.addEventListener(
            "pointerdown",
            (event) => {

                startX = event.clientX;
                startY = event.clientY;

                viewport.setPointerCapture?.(
                    event.pointerId
                );
            }
        );

        viewport.addEventListener(
            "pointerup",
            (event) => {

                const dx =
                    event.clientX - startX;

                const dy =
                    event.clientY - startY;

                /* Jangan dianggap swipe
                   kalau gerakannya lebih banyak
                   vertikal */

                if (
                    Math.abs(dx) < 40 ||
                    Math.abs(dx) < Math.abs(dy)
                ) {
                    return;
                }

                if (!window.gameInstance) return;

                const game =
                    window.gameInstance;

                if (dx < 0) {

                    game.carouselIndex =
                        Math.min(
                            game.carouselIndex + 1,
                            5
                        );

                } else {

                    game.carouselIndex =
                        Math.max(
                            game.carouselIndex - 1,
                            0
                        );
                }

                game._updateCarouselPosition();

                if (game.audio) {
                    game.audio.playClick();
                }
            }
        );
    }

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initSwipe
        );

    } else {

        initSwipe();

    }

})();