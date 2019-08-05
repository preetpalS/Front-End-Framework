declare namespace FrontEndFramework {
    namespace ScreenDimensions {
        interface ScreenDimensions {
            availableHeight: number;
            availableWidth: number;
            deviceHeight: number;
            deviceWidth: number;
        }
        var GetScreenDimensions: () => ScreenDimensions;
    }
}
