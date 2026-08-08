//
//  AccessCodeView.swift
//  EmbeddedCounselDemo
//
//  Created by Counsel on 5/12/25.
//
import SwiftUI

struct AccessCodeView: View {

    @Binding var isPresented: Bool
    @State private var accessCode: String = ""
    @State private var showErrorModal: Bool = false
    @AppStorage("token") private var token: String?
    @AppStorage("userType") private var userType: UserType?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Studio Demo")
                .font(.system(.largeTitle, weight: .bold))
                .foregroundStyle(.brandMidGreen)
            Text("Ask the Counsel Team for an access code to play with the demo")
                .font(.system(.subheadline))
                .foregroundStyle(.brandDarkBlue)
                .padding(.bottom, 80)
            SecureField(text: $accessCode, prompt: Text("Enter access code").font(.system(.subheadline)))
            {
                Text("Access code")
            }
            .padding(12)
            .overlay(RoundedRectangle(cornerRadius: 6).stroke(Color.gray))
            AsyncButton(title: "Login", action: {
                let (newToken, newUserType) = try await API.User.fetchToken(accessCode: accessCode)
                token = newToken
                userType = newUserType
                isPresented = false
            }, onError: { _ in
                showErrorModal = true
            })
        }
        .padding(.horizontal, 32)
        .alert("Error", isPresented: $showErrorModal) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("Either the access code was invalid or the network failed. Please try again.")
        }
    }
}
