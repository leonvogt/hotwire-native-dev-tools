import HotwireNative
import UIKit

public class DevToolsComponent: BridgeComponent {
    public override class var name: String { "dev-tools" }

    private let feedbackGenerators: [UIImpactFeedbackGenerator.FeedbackStyle: UIImpactFeedbackGenerator] = [
        .soft: UIImpactFeedbackGenerator(style: .soft),
        .heavy: UIImpactFeedbackGenerator(style: .heavy),
        .light: UIImpactFeedbackGenerator(style: .light)
    ]

    public override func onReceive(message: Message) {
        guard let event = Event(rawValue: message.event) else {
            return
        }

        switch event {
        case .connect:
            handleConnect()
        case .currentStackInfo:
            handleCurrentStackInfo()
        case .vibrate:
            handleVibrate(message: message)
        }
    }

    private func handleConnect() {
        reply(to: Event.connect.rawValue, with: connectResponseData(callbackReason: "connected"))
        prepareHapticFeedback()
    }

    private func handleCurrentStackInfo() {
        let stack = getViewControllerStack()
        let container = StackContainer(stack: stack)

        reply(to: Event.currentStackInfo.rawValue, with: container)
    }

    private func handleVibrate(message: Message) {
        guard let data: VibrateMessageData = message.data() else { return }

        let impactStyles: [String: UIImpactFeedbackGenerator.FeedbackStyle] = [
            "soft": .soft,
            "heavy": .heavy,
            "light": .light
        ]

        let notificationStyles: [String: UINotificationFeedbackGenerator.FeedbackType] = [
            "success": .success,
            "warning": .warning,
            "error": .error
        ]

        if let notificationStyle = notificationStyles[data.style ?? ""] {
            UINotificationFeedbackGenerator().notificationOccurred(notificationStyle)
        } else {
            let feedbackStyle = impactStyles[data.style ?? "light"] ?? .light
            feedbackGenerators[feedbackStyle]?.impactOccurred()
        }
    }

    private func getViewControllerStack() -> [ScreenInfo] {
        guard let keyWindow = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .flatMap({ $0.windows })
            .first(where: { $0.isKeyWindow }),
              let rootViewController = keyWindow.rootViewController else {
            return []
        }

        return collectViewControllerInfo(from: rootViewController)
    }

    private func collectViewControllerInfo(from viewController: UIViewController) -> [ScreenInfo] {
        var stack: [ScreenInfo] = []
        var info: ScreenInfo

        // Try to cast the different ViewControllers
        if let visitableVC = viewController as? VisitableViewController {
            // If this line raises an error, you might use an older version of Hotwire Native.
            // In that case, use the following line instead:
            // let url: URL? = visitableVC.visitableURL
            let url: URL? = visitableVC.currentVisitableURL

            let properties = url.map { Hotwire.config.pathConfiguration.properties(for: $0) } ?? [:]
            let title = visitableVC.title ?? visitableVC.visitableView.webView?.title ?? ""

            info = ScreenInfo(
                type: "VisitableViewController",
                title: title,
                url: url?.absoluteString,
                pathConfigurationProperties: convertPropertiesToJSON(properties),
                children: []
            )
        } else if let navigationController = viewController as? UINavigationController {
            let childrenInfo = navigationController.viewControllers.flatMap {
                collectViewControllerInfo(from: $0)
            }
            info = ScreenInfo(
                type: "UINavigationController",
                title: navigationController.title ?? "",
                children: childrenInfo
            )
        } else if let tabBarController = viewController as? UITabBarController {
            let childrenInfo = (tabBarController.viewControllers ?? []).flatMap {
                collectViewControllerInfo(from: $0)
            }
            info = ScreenInfo(
                type: "UITabBarController",
                title: tabBarController.title ?? "",
                children: childrenInfo
            )
        } else {
            // Handle regular view controllers and their children
            var children: [ScreenInfo] = []

            // Add presented view controller if exists
            if let presentedVC = viewController.presentedViewController {
                children.append(contentsOf: collectViewControllerInfo(from: presentedVC))
            }

            // Add child view controllers
            children.append(contentsOf: viewController.children.flatMap {
                collectViewControllerInfo(from: $0)
            })

            info = ScreenInfo(
                type: "Screen",
                title: viewController.title ?? "",
                children: children
            )
        }

        stack.append(info)
        return stack
    }

    // Prepares UIImpactFeedbackGenerator instances in advance to prevent lag on first use
    private func prepareHapticFeedback() {
        feedbackGenerators.values.forEach { $0.prepare() }
    }

    private func convertPropertiesToJSON(_ properties: [String: AnyHashable]) -> String {
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: properties)
            if let jsonString = String(data: jsonData, encoding: .utf8) {
                return jsonString
            }
        } catch {
            // no-op
        }

        return "{}"
    }
}

// MARK: - Events

private extension DevToolsComponent {
    enum Event: String {
        case connect
        case currentStackInfo
        case vibrate
    }
}

// MARK: Message data

private extension DevToolsComponent {

    struct VibrateMessageData: Decodable {
        let style: String?
    }

    // MARK: Response Structs
    struct connectResponseData: Encodable {
        let callbackReason: String
    }

    struct StackContainer: Encodable {
        let stack: [ScreenInfo]
    }

    struct ScreenInfo: Codable {
        let type: String
        let title: String
        let url: String?
        let pathConfigurationProperties: String?
        let children: [ScreenInfo]

        init(type: String, title: String, url: String? = nil, pathConfigurationProperties: String? = nil, children: [ScreenInfo] = []) {
            self.type = type
            self.title = title
            self.url = url
            self.pathConfigurationProperties = pathConfigurationProperties
            self.children = children
        }
    }
}
