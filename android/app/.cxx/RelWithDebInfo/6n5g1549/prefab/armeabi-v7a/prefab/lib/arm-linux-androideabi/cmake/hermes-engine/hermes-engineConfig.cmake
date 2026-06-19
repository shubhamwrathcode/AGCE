if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/Users/wrathcodetechnology/.gradle/caches/8.13/transforms/4c90d1a1e70fe84eeaa9d426267044a4/transformed/jetified-hermes-android-0.79.2-release/prefab/modules/libhermes/libs/android.armeabi-v7a/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/wrathcodetechnology/.gradle/caches/8.13/transforms/4c90d1a1e70fe84eeaa9d426267044a4/transformed/jetified-hermes-android-0.79.2-release/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

