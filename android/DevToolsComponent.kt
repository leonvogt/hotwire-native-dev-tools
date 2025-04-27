package replace.with.your.name // Replace with your package name

import android.util.Log
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentManager
import replace.with.your.name.MainActivity // Replace with your package name
import dev.hotwire.core.bridge.BridgeComponent
import dev.hotwire.core.bridge.BridgeDelegate
import dev.hotwire.core.bridge.Message
import dev.hotwire.core.config.Hotwire
import dev.hotwire.navigation.destinations.HotwireDestination
import dev.hotwire.navigation.fragments.HotwireWebFragment
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

class DevToolsComponent(
    name: String,
    private val hotwireDelegate: BridgeDelegate<HotwireDestination>
) : BridgeComponent<HotwireDestination>(name, hotwireDelegate) {

    private val fragment: Fragment
        get() = hotwireDelegate.destination.fragment

    private val mainActivity: MainActivity?
        get() = fragment.activity as? MainActivity

    override fun onReceive(message: Message) {
        when (message.event) {
            "connect" -> handleConnect(message)
            "currentStackInfo" -> handleCurrentStackInfo(message)
            "propertiesForUrl" -> handlePropertiesForUrl(message)
            "vibrate" -> null
            else -> Log.w("DevToolsComponent", "Unknown event for message: $message")
        }
    }

    private fun handleConnect(message: Message) {
        replyTo("connect", ConnectResultData("connected"))
    }

    private fun handleCurrentStackInfo(message: Message) {
        val stack = getNavigationStack()
        replyTo("currentStackInfo", Stack(stack))
    }

    private fun handlePropertiesForUrl(message: Message) {
        val data = message.data<PropertiesForUrlData>() ?: return
        val properties = Hotwire.config.pathConfiguration.properties(data.url)
        replyTo("propertiesForUrl", PropertiesForUrlResultData(convertProperties(properties)))
    }

    private fun getNavigationStack(): List<FragmentInfo> {
        val stack = mutableListOf<FragmentInfo>()

        mainActivity?.supportFragmentManager?.let { fragmentManager ->
            // Get the root fragments
            stack.addAll(collectFragmentInfo(fragmentManager))
        }

        return stack
    }

    private fun collectFragmentInfo(
        fragmentManager: FragmentManager,
        depth: Int = 0
    ): List<FragmentInfo> {
        val fragments = mutableListOf<FragmentInfo>()

        // Currently we don't have a good way to get the title or URL of the back stack entries
        // Therefore we just add an empty entry for each back stack entry
        // Hopefully we can improve this in the future
        for (entry in 0 until fragmentManager.backStackEntryCount) {
            fragments.add(
                FragmentInfo(
                    type = "BackStackEntry",
                    title = ""
                )
            )
        }

        // Collect information about current fragments
        fragmentManager.fragments.forEach { fragment ->
            val children = if (fragment.childFragmentManager.fragments.isNotEmpty()) {
                collectFragmentInfo(fragment.childFragmentManager, depth + 1)
            } else {
                emptyList()
            }

            val info = when (fragment) {
                is HotwireWebFragment -> {
                    val properties = Hotwire.config.pathConfiguration.properties(fragment.location)

                    FragmentInfo(
                        type = "HotwireWebFragment",
                        title = fragment.toolbarForNavigation()?.title.toString(),
                        url = fragment.location,
                        pathConfigurationProperties = convertProperties(properties),
                        children = children
                    )
                }
                else -> {
                    FragmentInfo(
                        type = fragment.javaClass.simpleName,
                        title = fragment.tag ?: "",
                        children = children
                    )
                }
            }

            fragments.add(info)
        }

        return fragments
    }

    private fun convertProperties(properties: Map<String, Any>): Map<String, String> {
        return properties.mapValues { (_, value) ->
            when (value) {
                is String -> value
                else -> value.toString()
            }
        }
    }

    @Serializable
    data class PropertiesForUrlData(
        @SerialName("url") val url: String
    )

    @Serializable
    data class PropertiesForUrlResultData(
        @SerialName("properties") val properties: Map<String, String> = emptyMap()
    )

    @Serializable
    data class ConnectResultData(
        @SerialName("callbackReason") val callbackReason: String
    )

    @Serializable
    data class Stack(
        val stack: List<FragmentInfo>
    )

    @Serializable
    data class FragmentInfo(
        val type: String,
        val title: String,
        val url: String? = null,
        val pathConfigurationProperties: Map<String, String> = emptyMap(),
        val children: List<FragmentInfo> = emptyList()
    )
}
