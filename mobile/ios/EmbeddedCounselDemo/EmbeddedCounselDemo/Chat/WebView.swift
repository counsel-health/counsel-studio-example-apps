//
//  WebView.swift
//  EmbeddedCounselDemo
//
//  Created by Counsel on 5/1/25.
//

import SwiftUI
@preconcurrency import WebKit

struct WebView: UIViewRepresentable {
    let url: URL
    @Binding var showLoadingScreen: Bool
    var onClose: () -> Void = {}

    func makeUIView(context: Context) -> UIView {
        let configuration = WKWebViewConfiguration()
        let userContentController = WKUserContentController()

        // Enable JavaScript to open new windows
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = true

        // Inject viewport meta tag script to set the viewport to the device width.
        // `viewport-fit=cover` is required so iOS reports real `env(safe-area-inset-*)`
        // values to CSS — without it, the page can't lay out behind the home indicator.
        let viewportScript = WKUserScript(
            source: """
                if (!document.querySelector('meta[name="viewport"]')) {
                    var meta = document.createElement('meta');
                    meta.setAttribute('name', 'viewport');
                    meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, interactive-widget=resizes-visual, viewport-fit=cover');
                    document.head.appendChild(meta);
                }
            """,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        userContentController.addUserScript(viewportScript)

        // Bridge `window.postMessage({ type: "counsel:..." })` from the Counsel
        // web app to the native `counsel` script-message handler. The web app
        // may also call window.webkit.messageHandlers.counsel.postMessage(...)
        // directly; both paths land in the same coordinator method below.
        //
        // We also forward EVERY message event (filtered or not) to the native
        // `counselDebug` handler so we can see what the Counsel page is actually
        // emitting. Remove this once the contract is confirmed working.
        let bridgeScript = WKUserScript(
            source: """
                console.log('[counsel-bridge] installed');
                window.addEventListener('message', function(event) {
                    try {
                        var serialized;
                        try { serialized = JSON.stringify(event.data); } catch (e) { serialized = String(event.data); }
                        console.log('[counsel-bridge] received message', event.origin, serialized);
                        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.counselDebug) {
                            window.webkit.messageHandlers.counselDebug.postMessage({ origin: event.origin, data: serialized });
                        }
                    } catch (e) {
                        console.log('[counsel-bridge] debug forward failed', e);
                    }

                    var data = event.data;
                    if (!data || typeof data !== 'object') return;
                    if (typeof data.type !== 'string') return;
                    if (data.type.indexOf('counsel:') !== 0) return;
                    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.counsel) {
                        window.webkit.messageHandlers.counsel.postMessage(JSON.stringify(data));
                    }
                });
            """,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        userContentController.addUserScript(bridgeScript)
        userContentController.add(context.coordinator, name: "counsel")
        userContentController.add(context.coordinator, name: "counselDebug")

        configuration.userContentController = userContentController

        let webView = CounselWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.scrollView.bounces = false
        webView.scrollView.alwaysBounceVertical = false
        webView.scrollView.alwaysBounceHorizontal = false
        webView.scrollView.bouncesZoom = false
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        // The Counsel web app owns its own scrolling, so the outer scroll view
        // stays disabled to match `configureForCounselPresentation`.
        webView.scrollView.isScrollEnabled = false
        // Disable WKWebView's automatic safe-area content insets so the web page
        // owns its own bottom layout via CSS env(safe-area-inset-bottom).
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.translatesAutoresizingMaskIntoConstraints = false

        // Clear container with a `systemUltraThinMaterial` blur backdrop behind
        // the web content, matching Counsel's presentation configuration.
        let container = UIView()
        container.backgroundColor = .clear

        let blurView = UIVisualEffectView(effect: UIBlurEffect(style: .systemUltraThinMaterial))
        blurView.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(blurView)
        container.addSubview(webView)

        NSLayoutConstraint.activate([
            blurView.topAnchor.constraint(equalTo: container.topAnchor),
            blurView.bottomAnchor.constraint(equalTo: container.bottomAnchor),
            blurView.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            blurView.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            webView.topAnchor.constraint(equalTo: container.topAnchor),
            webView.bottomAnchor.constraint(equalTo: container.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: container.trailingAnchor),
        ])

        context.coordinator.webView = webView
        return container
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        guard let webView = context.coordinator.webView else { return }
        var request = URLRequest(url: url)
        request.setValue("ios", forHTTPHeaderField: "x-counsel-app-os")
        webView.load(request)
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(showLoadingScreen: $showLoadingScreen, onClose: onClose)
    }

    class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        @Binding var showLoadingScreen: Bool
        let onClose: () -> Void
        weak var webView: WKWebView?

        init(showLoadingScreen: Binding<Bool>, onClose: @escaping () -> Void) {
            _showLoadingScreen = showLoadingScreen
            self.onClose = onClose
        }

        // Handle counsel:* events forwarded from the embedded Counsel web app.
        // The Counsel web app posts a JSON-encoded string; we parse it here.
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            if message.name == "counselDebug" {
                print("[counsel-bridge] saw message: \(message.body)")
                return
            }

            guard message.name == "counsel",
                  let json = message.body as? String,
                  let data = json.data(using: .utf8),
                  let body = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let type = body["type"] as? String else {
                print("[counsel] unrecognized message body: \(message.body)")
                return
            }

            print("[counsel] event: \(type) body=\(body)")
            switch type {
            case "counsel:ready":
                showLoadingScreen = false
            case "counsel:close":
                onClose()
            default:
                print("[counsel] unhandled event: \(type)")
            }
        }

        // Fallback: if counsel:ready never fires (e.g. the web app hasn't shipped
        // that event yet), still hide the loading screen once the document loads.
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            print("[counsel] WKWebView didFinish navigation — hiding loading screen as fallback")
            showLoadingScreen = false
        }

        private func openInExternalBrowser(_ url: URL) {
            print("Opening URL in external browser: \(url)")

            UIApplication.shared.open(url, options: [:]) { success in
                print("External browser open success: \(success)")
            }
        }

        // Handle target="_blank" links
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            print("decidePolicyFor called with URL: \(navigationAction.request.url)")
            print("Current webView URL: \(webView.url?.absoluteString ?? "none")")
            if navigationAction.targetFrame == nil {
                if let url = navigationAction.request.url {
                    openInExternalBrowser(url)
                }
                decisionHandler(.cancel)
                return
            }

            decisionHandler(.allow)
        }

        // Handle window.open() calls
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            print("createWebView called with URL: \(navigationAction.request.url)")
            print("Current webView URL: \(webView.url?.absoluteString ?? "none")")
            if let url = navigationAction.request.url, url != webView.url {
                openInExternalBrowser(url)
            }
            // Always return nil to prevent creating new WebViews
            return nil
        }
    }
}

/// `WKWebView` subclass that suppresses the system keyboard accessory bar,
/// matching `showsBuiltInInputAccessoryView = false` in Counsel's presentation.
final class CounselWebView: WKWebView {
    override var inputAccessoryView: UIView? { nil }
}
